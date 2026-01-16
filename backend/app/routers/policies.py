"""
 * Policy API Routes
 *
 * This file contains all API endpoints for managing policies in the
 * ASA Policy Management System. Policies can be created, read, updated,
 * and deleted by admins, while public users can only view approved policies.
 *
 * Public Functions:
 *    convert_policy_from_db(row: dict) --> dict
 *        Converts a database row to policy response format
 *    get_policies(status: Optional[PolicyStatus], section: Optional[str], 
 *      search: Optional[str], limit: int, offset: int, db: Client) --> List[PolicyResponse]
 *        Gets all policies with optional filtering (admin only)
 *    get_approved_policies(section: Optional[str], search: Optional[str], 
 *      db: Client) --> List[PolicyResponse]
 *        Gets only approved policies (public access)
 *    get_policy(policy_id: str, db: Client) --> PolicyResponse
 *        Gets a single policy by ID
 *    create_policy(policy: PolicyCreate, current_user: dict, db: Client) --> PolicyResponse
 *        Creates a new policy (admin only)
 *    update_policy(policy_id: str, policy_update: PolicyUpdate, 
 *      current_user: dict, db: Client) --> PolicyResponse
 *        Updates an existing policy (admin only)
 *    delete_policy(policy_id: str, current_user: dict, db: Client) --> None
 *        Deletes a policy (admin only)
 *    get_policy_versions(policy_id: str, current_user: dict, db: Client) --> List[PolicyResponse]
 *        Gets version history for a policy (admin only)
 *
 * @author: ASA Policy App Development Team
 * @date: January 2026
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from app.core.database import get_db, get_service_db
from app.core.auth import require_admin, get_optional_user, require_suggestion_manager
from app.models.schemas import (
    PolicyCreate, PolicyUpdate, PolicyResponse, PolicyStatus, PolicySearchParams
)
from app.core.config import settings
from supabase import Client
from datetime import datetime

router = APIRouter()


def convert_policy_from_db(row: dict) -> dict:
    """
    Convert database row to policy response format
    
    Maps database column names to API field names:
    - name -> policy_name
    - content -> policy_content
    
    Args:
        row: Dictionary containing policy data from database
        
    Returns:
        dict: Formatted policy dictionary with API field names
    """
    return {
        "id": str(row.get("id")),
        "policy_id": row.get("policy_id", ""),
        "policy_name": row.get("name", ""),  # Map name to policy_name
        "section": row.get("section", "1"),
        "policy_content": row.get("content", ""),  # Map content to policy_content
        "status": row.get("status", "draft"),
        "created_at": row.get("created_at"),
        "updated_at": row.get("updated_at"),
        "created_by": row.get("created_by"),
        "updated_by": row.get("updated_by")
    }


@router.get("/", response_model=List[PolicyResponse])
async def get_policies(
    status: Optional[PolicyStatus] = Query(None, description="Filter by status"),
    section: Optional[str] = Query(None, description="Filter by section"),
    search: Optional[str] = Query(None, description="Search query"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Client = Depends(get_db)
) -> List[PolicyResponse]:
    """
    Get all policies with optional filtering (admin only)
    
    Args:
        status: Optional status filter (draft, approved, archived, under_review)
        section: Optional section filter (1, 2, or 3)
        search: Optional search query to filter by name, policy_id, or content
        limit: Maximum number of results to return (1-100)
        offset: Number of results to skip for pagination
        db: Supabase database client
        
    Returns:
        List[PolicyResponse]: List of policy objects matching the filters
        
    Raises:
        HTTPException: 500 if database error occurs
    """
    try:
        query = db.table(settings.POLICIES_TABLE).select("*")
        
        # Apply filters
        if status:
            query = query.eq("status", status.value)
        if section:
            query = query.eq("section", section)
        # Apply pagination
        query = query.range(offset, offset + limit - 1)
        
        # Order by section and policy_id
        query = query.order("section").order("policy_id")
        
        response = query.execute()
        
        # Filter by search term in Python if provided (Supabase Python client has limited OR support)
        policies: List[dict] = [convert_policy_from_db(row) for row in response.data]
        if search:
            search_lower: str = search.lower()
            policies = [
                p for p in policies
                if search_lower in p.get("policy_name", "").lower()
                or search_lower in p.get("policy_id", "").lower()
                or search_lower in p.get("policy_content", "").lower()
            ]
        
        return policies
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching policies: {str(e)}")


@router.get("/approved", response_model=List[PolicyResponse])
async def get_approved_policies(
    section: Optional[str] = Query(None, description="Filter by section"),
    search: Optional[str] = Query(None, description="Search query"),
    db: Client = Depends(get_db)
) -> List[PolicyResponse]:
    """
    Get only approved policies (public view)
    
    This endpoint is accessible without authentication and returns
    only policies with status "approved".
    
    Args:
        section: Optional section filter (1, 2, or 3)
        search: Optional search query to filter by name, policy_id, or content
        db: Supabase database client
        
    Returns:
        List[PolicyResponse]: List of approved policy objects
        
    Raises:
        HTTPException: 500 if database error occurs
    """
    try:
        query = db.table(settings.POLICIES_TABLE).select("*").eq("status", "approved")
        
        if section:
            query = query.eq("section", section)
        
        query = query.order("section").order("policy_id")
        
        response = query.execute()
        
        # Filter by search term in Python if provided
        policies: List[dict] = [convert_policy_from_db(row) for row in response.data]
        if search:
            search_lower: str = search.lower()
            policies = [
                p for p in policies
                if search_lower in p.get("name", "").lower()
                or search_lower in p.get("policy_id", "").lower()
                or search_lower in p.get("content", "").lower()
            ]
        
        return policies
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching approved policies: {str(e)}")


@router.get("/{policy_id}", response_model=PolicyResponse)
async def get_policy(
    policy_id: str,
    db: Client = Depends(get_db)
) -> PolicyResponse:
    """
    Get a single policy by policy_id (e.g., "1.1.1")
    
    Args:
        policy_id: Policy identifier (e.g., "1.1.1"), not UUID
        db: Supabase database client
        
    Returns:
        PolicyResponse: Policy object with all details
        
    Raises:
        HTTPException: 404 if policy not found, 500 if database error occurs
    """
    try:
        # Look up by policy_id (TEXT field like "1.1.1"), not UUID id
        response = db.table(settings.POLICIES_TABLE).select("*").eq("policy_id", policy_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=404, detail="Policy not found")
        
        return convert_policy_from_db(response.data[0])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching policy: {str(e)}")


@router.post("/", response_model=PolicyResponse, status_code=201)
async def create_policy(
    policy: PolicyCreate,
    current_user: dict = Depends(require_suggestion_manager),  # Admin or policy_working_group
    db: Client = Depends(get_service_db)  # Use service role for operations
) -> PolicyResponse:
    """
    Create a new policy (admin or policy_working_group)
    
    New policies are automatically marked as "draft" status.
    Only admins can approve policies using the approve endpoint.
    
    Args:
        policy: PolicyCreate object containing policy data
        current_user: Current authenticated user (admin or policy_working_group)
        db: Supabase database client with service role
        
    Returns:
        PolicyResponse: Created policy object (status will be "draft")
        
    Raises:
        HTTPException: 400 if policy_id already exists, 500 if creation fails
    """
    try:
        # Check if policy_id already exists
        existing = db.table(settings.POLICIES_TABLE).select("*").eq("policy_id", policy.policy_id).execute()
        if existing.data:
            raise HTTPException(status_code=400, detail="Policy ID already exists")
        
        # Map API field names to database column names
        # Force status to DRAFT - only admin can approve via approve endpoint
        policy_data: dict = {
            "policy_id": policy.policy_id,
            "name": policy.policy_name,  # Map policy_name to name
            "section": policy.section,
            "content": policy.policy_content,  # Map policy_content to content
            "status": PolicyStatus.DRAFT.value,  # Always create as draft
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "created_by": current_user.get("id"),
            "updated_by": current_user.get("id")
        }
        
        response = db.table(settings.POLICIES_TABLE).insert(policy_data).execute()
        
        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to create policy")
        
        return convert_policy_from_db(response.data[0])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating policy: {str(e)}")


@router.put("/{policy_id}", response_model=PolicyResponse)
async def update_policy(
    policy_id: str,
    policy_update: PolicyUpdate,
    current_user: dict = Depends(require_suggestion_manager),  # Admin or policy_working_group
    db: Client = Depends(get_service_db)  # Use service role for operations
) -> PolicyResponse:
    """
    Update a policy (admin or policy_working_group)
    
    Before updating, saves the current version to policy_versions table
    for version history tracking. Updated policies are automatically marked
    as "draft" status. Only admins can approve policies using the approve endpoint.
    
    Args:
        policy_id: Policy identifier (e.g., "1.1.1"), not UUID
        policy_update: PolicyUpdate object containing fields to update
        current_user: Current authenticated user (admin or policy_working_group)
        db: Supabase database client with service role
        
    Returns:
        PolicyResponse: Updated policy object (status will be "draft" if changed)
        
    Raises:
        HTTPException: 404 if policy not found, 500 if update fails
    """
    try:
        # Get existing policy (before update) - look up by policy_id (TEXT), not UUID
        existing = db.table(settings.POLICIES_TABLE).select("*").eq("policy_id", policy_id).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Policy not found")
        
        existing_policy = existing.data[0]
        # Get the UUID id for version history and update operations
        policy_uuid = existing_policy.get("id")
        
        # Build update data - map API field names to database column names
        update_data: dict = {}
        if policy_update.policy_name is not None:
            update_data["name"] = policy_update.policy_name  # Map policy_name to name
        if policy_update.section is not None:
            update_data["section"] = policy_update.section
        if policy_update.policy_content is not None:
            update_data["content"] = policy_update.policy_content  # Map policy_content to content
        # Always set status to DRAFT when policy is updated
        # Only admin can approve policies via the approve endpoint
        # If any content fields are being updated, force status to DRAFT
        if policy_update.policy_name is not None or policy_update.policy_content is not None or policy_update.section is not None:
            update_data["status"] = PolicyStatus.DRAFT.value
        
        # Only save version if something actually changed
        has_changes = (
            (policy_update.policy_name is not None and policy_update.policy_name != existing_policy.get("name")) or
            (policy_update.section is not None and policy_update.section != existing_policy.get("section")) or
            (policy_update.policy_content is not None and policy_update.policy_content != existing_policy.get("content")) or
            ("status" in update_data and update_data["status"] != existing_policy.get("status"))
        )
        
        if has_changes:
            # Save current version to policy_versions table before updating
            # policy_versions.policy_id references policies.id (UUID), not policy_id (TEXT)
            versions_response = db.table(settings.POLICY_VERSIONS_TABLE).select("version_number").eq("policy_id", policy_uuid).order("version_number", desc=True).limit(1).execute()
            
            next_version: int = 1
            if versions_response.data and len(versions_response.data) > 0:
                next_version = int(versions_response.data[0].get("version_number", 0)) + 1
            
            # Create version record with the current (pre-update) state
            # Use UUID for the foreign key relationship
            version_data: dict = {
                "policy_id": policy_uuid,  # UUID for foreign key relationship
                "version_number": next_version,
                "name": existing_policy.get("name", ""),
                "section": existing_policy.get("section", ""),
                "content": existing_policy.get("content", ""),
                "status": existing_policy.get("status", "draft"),
                "created_at": datetime.utcnow().isoformat(),
                "created_by": current_user.get("id")
            }
            
            # Insert version history
            db.table(settings.POLICY_VERSIONS_TABLE).insert(version_data).execute()
        
        # Add metadata to update
        update_data["updated_at"] = datetime.utcnow().isoformat()
        update_data["updated_by"] = current_user.get("id")
        
        # Update by policy_id (TEXT field), not UUID
        response = db.table(settings.POLICIES_TABLE).update(update_data).eq("policy_id", policy_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to update policy")
        
        return convert_policy_from_db(response.data[0])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating policy: {str(e)}")


@router.delete("/{policy_id}", status_code=204)
async def delete_policy(
    policy_id: str,
    current_user: dict = Depends(require_admin),  # Require admin role
    db: Client = Depends(get_service_db)  # Use service role for admin operations
) -> None:
    """
    Delete a policy (admin only)
    
    Args:
        policy_id: Policy identifier (e.g., "1.1.1"), not UUID
        current_user: Current authenticated admin user
        db: Supabase database client with service role
        
    Returns:
        None: 204 No Content on success
        
    Raises:
        HTTPException: 404 if policy not found, 500 if deletion fails
    """
    try:
        # Check if policy exists - look up by policy_id (TEXT), not UUID
        existing = db.table(settings.POLICIES_TABLE).select("*").eq("policy_id", policy_id).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Policy not found")
        
        # Delete policy by policy_id (TEXT field)
        db.table(settings.POLICIES_TABLE).delete().eq("policy_id", policy_id).execute()
        
        return None
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting policy: {str(e)}")


def convert_version_from_db(row: dict, policy_uuid: str) -> dict:
    """
    Convert policy version database row to policy response format
    
    Args:
        row: Dictionary containing version data from database
        policy_uuid: The policy UUID (for id field)
        
    Returns:
        dict: Formatted policy dictionary with API field names
    """
    return {
        "id": policy_uuid,  # Use the policy UUID, not version ID
        "policy_id": "",  # Will be set by caller with the actual policy_id (TEXT)
        "policy_name": row.get("name", ""),  # Map name to policy_name
        "section": row.get("section", "1"),
        "policy_content": row.get("content", ""),  # Map content to policy_content
        "status": row.get("status", "draft"),
        "created_at": row.get("created_at"),
        "updated_at": row.get("created_at"),  # Use created_at as updated_at for versions
        "created_by": row.get("created_by"),
        "updated_by": row.get("created_by")
    }


@router.put("/{policy_id}/approve", response_model=PolicyResponse)
async def approve_policy(
    policy_id: str,
    current_user: dict = Depends(require_admin),  # Only admin can approve
    db: Client = Depends(get_service_db)  # Use service role for admin operations
) -> PolicyResponse:
    """
    Approve a policy (admin only)
    
    Changes the policy status from "draft" to "approved".
    Only administrators can approve policies.
    
    Args:
        policy_id: Policy identifier (e.g., "1.1.1"), not UUID
        current_user: Current authenticated admin user
        db: Supabase database client with service role
        
    Returns:
        PolicyResponse: Approved policy object
        
    Raises:
        HTTPException: 404 if policy not found, 400 if already approved, 500 if update fails
    """
    try:
        # Get existing policy - look up by policy_id (TEXT), not UUID
        existing = db.table(settings.POLICIES_TABLE).select("*").eq("policy_id", policy_id).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Policy not found")
        
        existing_policy = existing.data[0]
        current_status = existing_policy.get("status", "draft")
        
        # Check if already approved
        if current_status == PolicyStatus.APPROVED.value:
            raise HTTPException(
                status_code=400,
                detail="Policy is already approved"
            )
        
        # Update status to approved
        update_data = {
            "status": PolicyStatus.APPROVED.value,
            "updated_at": datetime.utcnow().isoformat(),
            "updated_by": current_user.get("id")
        }
        
        response = db.table(settings.POLICIES_TABLE).update(update_data).eq("policy_id", policy_id).execute()
        
        if not response.data:
            raise HTTPException(status_code=500, detail="Failed to approve policy")
        
        return convert_policy_from_db(response.data[0])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error approving policy: {str(e)}")


@router.get("/{policy_id}/versions", response_model=List[PolicyResponse])
async def get_policy_versions(
    policy_id: str,
    current_user: dict = Depends(require_admin),  # Require admin role
    db: Client = Depends(get_service_db)  # Admin only
) -> List[PolicyResponse]:
    """
    Get version history for a policy (admin only)
    
    Returns all previous versions of the policy, ordered by version number
    (newest first). The current version is not included - use GET /policies/{policy_id}
    to get the current version.
    
    Args:
        policy_id: Policy identifier (e.g., "1.1.1"), not UUID
        current_user: Current authenticated admin user
        db: Supabase database client with service role
        
    Returns:
        List[PolicyResponse]: List of policy versions (newest first)
        
    Raises:
        HTTPException: 404 if policy not found, 500 if database error occurs
    """
    try:
        # Verify policy exists - look up by policy_id (TEXT), not UUID
        policy_response = db.table(settings.POLICIES_TABLE).select("*").eq("policy_id", policy_id).execute()
        if not policy_response.data:
            raise HTTPException(status_code=404, detail="Policy not found")
        
        # Get the policy data
        policy_data = policy_response.data[0]
        policy_uuid = policy_data.get("id")  # UUID for foreign key lookup
        policy_identifier = policy_data.get("policy_id", "")  # TEXT identifier like "1.1.1"
        
        # Get all versions for this policy using UUID (policy_versions.policy_id references policies.id UUID)
        versions_response = db.table(settings.POLICY_VERSIONS_TABLE).select("*").eq("policy_id", policy_uuid).order("version_number", desc=True).execute()
        
        # Convert versions to response format
        versions = []
        for version_row in versions_response.data:
            # Add the policy_id identifier to each version
            version_dict = convert_version_from_db(version_row, policy_uuid)
            version_dict["policy_id"] = policy_identifier  # Use the policy's TEXT identifier
            versions.append(version_dict)
        
        return versions
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching policy versions: {str(e)}")
