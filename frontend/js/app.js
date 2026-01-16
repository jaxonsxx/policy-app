// Completed by Dominic del Rosario, 
// Claude AI was used to assist with the functionality of the suggestion box and grid but manually typed in and adjusted by author
// Originally only displayed grids with information in arrays for demo
// Victor connected this to the admin pages for prototype 

// ============================================
// ASA Policy App - Public View JavaScript
// ============================================

// Storage Keys (same as admin)
const STORAGE_KEYS = {
    POLICIES: 'asa_policies',
    BYLAWS: 'asa_bylaws',
    SUGGESTIONS: 'asa_suggestions'
};

/** 
 * Gets the human-readable section name from a section number.
 * @param {string|number} section - The section number (1, 2, or 3).
 * @returns {string} The formatted section name, or "Section {number}" if not found.
 */
function getSectionName(section) {
    const sectionNames = {
        '1': 'Organizational Identity & Values',
        '2': 'Governance & Elections',
        '3': 'Operations, Staff & Finance'
    };
    return sectionNames[section] || `Section ${section}`;
}

/**
 * Retrieves approved policies from API.
 * @returns {Promise<Array>} A promise that resolves to an array of approved policy objects.
 */
async function getApprovedPolicies(section = null, search = null) {
    try {
        const policies = await asaAPI.policies.getApprovedPolicies(section, search);
        // Normalize API response to match expected format
        return policies.map(p => ({
            id: p.id,
            policyId: p.policy_id || p.id,
            name: p.policy_name || p.name || 'Untitled',
            policyName: p.policy_name || p.name || 'Untitled',
            content: p.policy_content || p.content || '',
            policyContent: p.policy_content || p.content || '',
            section: p.section || '1',
            status: p.status || 'approved',
            updatedAt: p.updated_at || p.created_at,
            createdAt: p.created_at
        }));
    } catch (error) {
        console.error('Error fetching approved policies:', error);
        return [];
    }
}

/**
 * Retrieves approved bylaws from API.
 * @returns {Promise<Array>} A promise that resolves to an array of approved bylaw objects.
 */
async function getApprovedBylaws(search = null) {
    try {
        const bylaws = await asaAPI.bylaws.getApprovedBylaws(search);
        // Normalize API response to match expected format
        return bylaws.map(b => ({
            id: b.id,
            number: b.bylaw_number || b.number || '',
            bylawNumber: b.bylaw_number || b.number || '',
            title: b.bylaw_title || b.title || 'Untitled',
            bylawTitle: b.bylaw_title || b.title || 'Untitled',
            content: b.bylaw_content || b.content || '',
            bylawContent: b.bylaw_content || b.content || '',
            status: b.status || 'approved',
            updatedAt: b.updated_at || b.created_at,
            createdAt: b.created_at
        }));
    } catch (error) {
        console.error('Error fetching approved bylaws:', error);
        return [];
    }
}

// State
let openSections = [1, 2, 3]; // Start with all sections open
let searchTerm = "";
let bylawSearchTerm = "";

/**
 * Renders all policy sections with their cards in the sections container.
 * Filters policies based on the current search term and groups them by section.
 * @returns {Promise<void>}
 */
async function renderSections() {
    const container = document.getElementById('sectionsContainer');
    if (!container) return;
    
    container.innerHTML = '<div class="loading">Loading policies...</div>';

    try {
        // Get approved policies from API
        const approvedPolicies = await getApprovedPolicies(null, searchTerm);
    
    // Group policies by section
    const sectionsMap = {
        '1': { id: 1, title: getSectionName('1'), items: [] },
        '2': { id: 2, title: getSectionName('2'), items: [] },
        '3': { id: 3, title: getSectionName('3'), items: [] }
    };

    approvedPolicies.forEach(policy => {
        const section = policy.section || '1';
        if (sectionsMap[section]) {
            sectionsMap[section].items.push({
                id: policy.id,
                policyId: policy.policyId || policy.id,
                name: policy.name || policy.policyName || 'Untitled',
                section: section,
                sectionName: getSectionName(section)
            });
        }
    });

    // Convert to array and filter
    const sections = Object.values(sectionsMap);
    
    sections.forEach(section => {
        const filteredItems = section.items.filter(item => 
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.policyId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.sectionName.toLowerCase().includes(searchTerm.toLowerCase())
        );

        // Only show section if it has matching items or search is empty
        if (filteredItems.length > 0 || searchTerm === '') {
            const itemsToShow = searchTerm === '' ? section.items : filteredItems;
            const sectionEl = createSectionElement(section, itemsToShow);
            container.appendChild(sectionEl);
        }
    });

        if (container.children.length === 0) {
            container.innerHTML = '<div class="no-results">No results found</div>';
        }
    } catch (error) {
        console.error('Error rendering sections:', error);
        container.innerHTML = '<div class="no-results">Error loading policies. Please try again later.</div>';
    }
}

/**
 * Completed by Dominic del Rosario, with steps from Claude AI
 * Creates a DOM element for a policy section with collapsible header and content.
 * @param {Object} section - The section object containing id, title, and items.
 * @param {Array<Object>} items - Array of policy items to display in the section.
 * @returns {HTMLElement} The created section DOM element.
 */
function createSectionElement(section, items) {
    const isOpen = openSections.includes(section.id);
    
    const sectionDiv = document.createElement('div');
    sectionDiv.className = 'section';
    
    const header = document.createElement('div');
    header.className = 'section-header';
    header.innerHTML = `
        <h2 class="section-title">${section.title}</h2>
        <span class="section-arrow ${isOpen ? 'open' : ''}">▼</span>
    `;
    header.onclick = () => toggleSection(section.id);
    
    const content = document.createElement('div');
    content.className = `section-content ${isOpen ? 'open' : ''}`;
    
    if (items.length > 0) {
        const grid = document.createElement('div');
        grid.className = 'cards-grid';
        
        items.forEach(item => {
            const card = createCardElement(item);
            grid.appendChild(card);
        });
        
        content.appendChild(grid);
    } else {
        content.innerHTML = '<div class="no-results">No items in this section</div>';
    }
    
    sectionDiv.appendChild(header);
    sectionDiv.appendChild(content);
    
    return sectionDiv;
}

/**
 * Completed by Dominic del Rosario, with steps from Claude AI
 * Creates a DOM element for a policy card with click handler.
 * @param {Object} item - The policy item object containing id, name, sectionName, and policyId.
 * @returns {HTMLElement} The created card DOM element.
 */
function createCardElement(item) {
    const card = document.createElement('div');
    card.className = 'card';
    card.onclick = () => handleCardClick(item);
    
    // Display: Policy name (bold, top), Section name, Policy ID
    card.innerHTML = `
        <div class="card-policy-name">${item.name || 'Untitled'}</div>
        <div class="card-section-name">${item.sectionName}</div>
        <div class="card-policy-id">${item.policyId}</div>
    `;
    
    return card;
}

/**
 * Completed by Dominic del Rosario,
 * Toggles the open/closed state of a policy section.
 * @param {number} sectionId - The ID of the section to toggle (1, 2, or 3).
 * @returns {void}
 */
function toggleSection(sectionId) {
    const index = openSections.indexOf(sectionId);
    if (index > -1) {
        openSections.splice(index, 1);
    } else {
        openSections.push(sectionId);
    }
    renderSections();
}

/**
 * Completed by Dominic del Rosario, 
 * Handles click events on policy cards by navigating to the policy detail page.
 * @param {Object} item - The policy item object containing the id to navigate to.
 * @returns {void}
 */
function handleCardClick(item) {
    // Navigate to policy detail page with the item's id as a query parameter
    window.location.href = `/frontend/public/policy-detail.html?id=${item.id}`;
}

/**
 * Completed by Dominic del Rosario, 
 * Handles search input events for filtering policies.
 * Opens all sections when a search term is entered.
 * @param {Event} e - The input event object.
 * @returns {void}
 */
async function handleSearch(e) {
    searchTerm = e.target.value;
    
    // Open all sections when searching
    if (searchTerm !== '') {
        openSections = [1, 2, 3];
    }
    
    await renderSections();
}

/**
 * Renders all bylaw cards in the bylaws container.
 * Filters bylaws based on the current search term.
 * @returns {Promise<void>}
 */
async function renderBylaws() {
    const container = document.getElementById('bylawsContainer');
    if (!container) return;
    
    container.innerHTML = '<div class="loading">Loading bylaws...</div>';
    
    try {
        // Get approved bylaws from API
        const approvedBylaws = await getApprovedBylaws(bylawSearchTerm);
    
    const filteredBylaws = approvedBylaws.filter(bylaw => {
        const title = (bylaw.title || bylaw.bylawTitle || '').toLowerCase();
        const number = (bylaw.number || bylaw.bylawNumber || '').toString().toLowerCase();
        const search = bylawSearchTerm.toLowerCase();
        return title.includes(search) || number.includes(search);
    });
    
    if (filteredBylaws.length > 0) {
        const grid = document.createElement('div');
        grid.className = 'cards-grid';
        
        filteredBylaws.forEach(bylaw => {
            const card = createBylawCardElement(bylaw);
            grid.appendChild(card);
        });
        
        container.appendChild(grid);
        } else {
            container.innerHTML = '<div class="no-results">No results found</div>';
        }
    } catch (error) {
        console.error('Error rendering bylaws:', error);
        container.innerHTML = '<div class="no-results">Error loading bylaws. Please try again later.</div>';
    }
}

/**
 * Completed by Dominic del Rosario, with indirect steps from Claude AI
 * Creates a DOM element for a bylaw card with click handler.
 * @param {Object} bylaw - The bylaw object containing id, title/bylawTitle, and number/bylawNumber.
 * @returns {HTMLElement} The created card DOM element.
 */
function createBylawCardElement(bylaw) {
    const card = document.createElement('div');
    card.className = 'card';
    card.onclick = () => handleBylawCardClick(bylaw);
    
    const title = bylaw.title || bylaw.bylawTitle || 'Untitled';
    const number = bylaw.number || bylaw.bylawNumber || '';
    
    card.innerHTML = `
        <div class="card-policy-name">${title}</div>
        <div class="card-section-name">Bylaw</div>
        <div class="card-policy-id">Bylaw #${number}</div>
    `;
    
    return card;
}

/**
 * Completed by Dominic del Rosario, 
 * Handles click events on bylaw cards by navigating to the bylaw detail page.
 * @param {Object} bylaw - The bylaw object containing the id to navigate to.
 * @returns {void}
 */
function handleBylawCardClick(bylaw) {
    // Navigate to bylaw detail page with the bylaw's id as a query parameter
    window.location.href = `/frontend/public/bylaw-detail.html?id=${bylaw.id}`;
}

/**
 * Completed by Dominic del Rosario, 
 * Handles search input events for filtering bylaws.
 * @param {Event} e - The input event object.
 * @returns {Promise<void>}
 */
async function handleBylawSearch(e) {
    bylawSearchTerm = e.target.value;
    await renderBylaws();
}

/**
 * Loads and displays policy detail information on the policy detail page.
 * Retrieves policy data from API and updates the page content.
 * @returns {Promise<void>}
 */
async function loadPolicyDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const policyId = urlParams.get('id');
    
    if (!policyId) {
        document.querySelector('.policy-detail-container').innerHTML = '<div class="no-results">Policy not found</div>';
        return;
    }
    
    try {
        const policyData = await asaAPI.policies.getPolicy(policyId);
        
        // Normalize API response
        const policy = {
            id: policyData.id,
            policyId: policyData.policy_id || policyData.id,
            name: policyData.policy_name || policyData.name || 'Untitled',
            policyName: policyData.policy_name || policyData.name || 'Untitled',
            content: policyData.policy_content || policyData.content || '',
            policyContent: policyData.policy_content || policyData.content || '',
            section: policyData.section || '1',
            status: policyData.status || 'approved',
            updatedAt: policyData.updated_at || policyData.created_at,
            createdAt: policyData.created_at
        };
        
        if (policy.status !== 'approved') {
            document.querySelector('.policy-detail-container').innerHTML = '<div class="no-results">Policy not found</div>';
            return;
        }
    
    // Update page content
    const policyNumber = document.querySelector('.policy-number');
    const policyTitle = document.querySelector('.policy-title');
    const policyContent = document.querySelector('.policy-content');
    const policyUpdated = document.querySelector('.policy-updated');
    
    if (policyNumber) {
        policyNumber.textContent = `Policy # ${policy.policyId || policy.id}`;
    }
    
    if (policyTitle) {
        policyTitle.textContent = policy.name || policy.policyName || 'Untitled';
    }
    
    if (policyContent) {
        const content = policy.content || policy.policyContent || 'No content available.';
        policyContent.innerHTML = `<p>${content}</p>`;
    }
    
    if (policyUpdated && policy.updatedAt) {
        const date = new Date(policy.updatedAt);
        policyUpdated.textContent = `Last Updated: ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    
        // Update sidebar with other policies
        await updatePolicySidebar(policy);
    } catch (error) {
        console.error('Error loading policy detail:', error);
        document.querySelector('.policy-detail-container').innerHTML = '<div class="no-results">Error loading policy. Please try again later.</div>';
    }
}

/**
 * Loads and displays bylaw detail information on the bylaw detail page.
 * Retrieves bylaw data from API and updates the page content.
 * @returns {Promise<void>}
 */
async function loadBylawDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const bylawId = urlParams.get('id');
    
    if (!bylawId) {
        document.querySelector('.policy-detail-container').innerHTML = '<div class="no-results">Bylaw not found</div>';
        return;
    }
    
    try {
        const bylawData = await asaAPI.bylaws.getBylaw(bylawId);
        
        // Normalize API response
        const bylaw = {
            id: bylawData.id,
            number: bylawData.bylaw_number || bylawData.number || '',
            bylawNumber: bylawData.bylaw_number || bylawData.number || '',
            title: bylawData.bylaw_title || bylawData.title || 'Untitled',
            bylawTitle: bylawData.bylaw_title || bylawData.title || 'Untitled',
            content: bylawData.bylaw_content || bylawData.content || '',
            bylawContent: bylawData.bylaw_content || bylawData.content || '',
            status: bylawData.status || 'approved',
            updatedAt: bylawData.updated_at || bylawData.created_at,
            createdAt: bylawData.created_at
        };
        
        if (bylaw.status !== 'approved') {
            document.querySelector('.policy-detail-container').innerHTML = '<div class="no-results">Bylaw not found</div>';
            return;
        }
    
    // Update page content
    const bylawNumber = document.querySelector('.policy-number');
    const bylawTitle = document.querySelector('.policy-title');
    const bylawContent = document.querySelector('.policy-content');
    const bylawUpdated = document.querySelector('.policy-updated');
    
    if (bylawNumber) {
        bylawNumber.textContent = `Bylaw #${bylaw.number || bylaw.bylawNumber || ''}`;
    }
    
    if (bylawTitle) {
        bylawTitle.textContent = bylaw.title || bylaw.bylawTitle || 'Untitled';
    }
    
    if (bylawContent) {
        const content = bylaw.content || bylaw.bylawContent || 'No content available.';
        bylawContent.innerHTML = `<p>${content}</p>`;
    }
    
    if (bylawUpdated && bylaw.updatedAt) {
        const date = new Date(bylaw.updatedAt);
        bylawUpdated.textContent = `Last Updated: ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
    
        // Update sidebar with other bylaws
        await updateBylawSidebar(bylaw);
    } catch (error) {
        console.error('Error loading bylaw detail:', error);
        document.querySelector('.policy-detail-container').innerHTML = '<div class="no-results">Error loading bylaw. Please try again later.</div>';
    }
}

/**
 * Updates the policy sidebar with links to other approved policies.
 * Groups policies by section and excludes the current policy.
 * @param {Object} currentPolicy - The currently displayed policy object.
 * @returns {Promise<void>}
 */
async function updatePolicySidebar(currentPolicy) {
    const sidebar = document.querySelector('.policy-sidebar');
    if (!sidebar) return;
    
    try {
        const approvedPolicies = await getApprovedPolicies();
        const otherPolicies = approvedPolicies.filter(p => p.id !== currentPolicy.id);
    
    if (otherPolicies.length === 0) {
        sidebar.innerHTML = '<h3 class="sidebar-title">Other Policies</h3><div class="sidebar-section"><p>No other policies available</p></div>';
        return;
    }
    
    // Group by section
    const bySection = {};
    otherPolicies.forEach(policy => {
        const section = policy.section || '1';
        if (!bySection[section]) {
            bySection[section] = [];
        }
        bySection[section].push(policy);
    });
    
    let html = '<h3 class="sidebar-title">Other Policies</h3>';
    
    Object.keys(bySection).sort().forEach(section => {
        html += `<div class="sidebar-section">`;
        html += `<h4 class="sidebar-section-title">${getSectionName(section)}</h4>`;
        bySection[section].forEach(policy => {
            const name = policy.name || policy.policyName || 'Untitled';
            const policyId = policy.policyId || policy.id;
            html += `<a href="/frontend/public/policy-detail.html?id=${policy.id}" class="sidebar-link-small">${policyId} - ${name}</a>`;
        });
        html += `</div>`;
    });
    
    sidebar.innerHTML = html;
}

/**
 * Updates the bylaw sidebar with links to other approved bylaws.
 * Excludes the current bylaw from the list.
 * @param {Object} currentBylaw - The currently displayed bylaw object.
 * @returns {Promise<void>}
 */
async function updateBylawSidebar(currentBylaw) {
    const sidebar = document.querySelector('.policy-sidebar');
    if (!sidebar) return;
    
    try {
        const approvedBylaws = await getApprovedBylaws();
        const otherBylaws = approvedBylaws.filter(b => b.id !== currentBylaw.id);
    
    if (otherBylaws.length === 0) {
        sidebar.innerHTML = '<h3 class="sidebar-title">Other Bylaws</h3><div class="sidebar-section"><p>No other bylaws available</p></div>';
        return;
    }
    
    let html = '<h3 class="sidebar-title">Other Bylaws</h3><div class="sidebar-section">';
    otherBylaws.forEach(bylaw => {
        const title = bylaw.title || bylaw.bylawTitle || 'Untitled';
        const number = bylaw.number || bylaw.bylawNumber || '';
        html += `<a href="/frontend/public/bylaw-detail.html?id=${bylaw.id}" class="sidebar-link">Bylaw #${number} - ${title}</a>`;
    });
        html += '</div>';
        
        sidebar.innerHTML = html;
    } catch (error) {
        console.error('Error updating bylaw sidebar:', error);
        sidebar.innerHTML = '<h3 class="sidebar-title">Other Bylaws</h3><div class="sidebar-section"><p>Error loading bylaws</p></div>';
    }
}

/**
 * Populates the suggestions form dropdown with approved policies.
 * Groups policies by section for better organization.
 * @returns {Promise<void>}
 */
async function populateSuggestionsDropdown() {
    const policySelect = document.getElementById('policySelect');
    if (!policySelect) return;
    
    try {
        const approvedPolicies = await getApprovedPolicies();
    
        // Clear existing options except the first one
        policySelect.innerHTML = '<option value="">Select</option>';
        
        if (approvedPolicies.length === 0) {
            policySelect.innerHTML += '<option value="">No policies available</option>';
            return;
        }
        
        // Group by section
        const bySection = {};
        approvedPolicies.forEach(policy => {
            const section = policy.section || '1';
            if (!bySection[section]) {
                bySection[section] = [];
            }
            bySection[section].push(policy);
        });
        
        // Add options grouped by section
        Object.keys(bySection).sort().forEach(section => {
            const sectionName = getSectionName(section);
            bySection[section].forEach(policy => {
                const name = policy.name || policy.policyName || 'Untitled';
                const policyId = policy.policyId || policy.id;
                const option = document.createElement('option');
                option.value = policy.id;
                option.textContent = `${policyId} - ${name} (${sectionName})`;
                policySelect.appendChild(option);
            });
        });
    } catch (error) {
        console.error('Error populating suggestions dropdown:', error);
        policySelect.innerHTML = '<option value="">Error loading policies</option>';
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    const sectionsContainer = document.getElementById('sectionsContainer');
    const bylawsContainer = document.getElementById('bylawsContainer');
    const policyDetailContainer = document.querySelector('.policy-detail-container');
    const suggestionForm = document.getElementById('suggestionForm');
    
    if (sectionsContainer) {
        // Policies page
        if (searchInput) {
            searchInput.addEventListener('input', handleSearch);
        }
        renderSections().catch(err => console.error('Error rendering sections:', err));
    } else if (bylawsContainer) {
        // Bylaws page
        if (searchInput) {
            searchInput.addEventListener('input', handleBylawSearch);
        }
        renderBylaws().catch(err => console.error('Error rendering bylaws:', err));
        
        // Download PDF button handler
        const downloadBtn = document.querySelector('.download-pdf-btn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => {
                console.log('Download PDF clicked');
                // You can implement PDF download functionality here
            });
        }
    } else if (policyDetailContainer) {
        // Check if it's a policy or bylaw detail page - try loading both
        const urlParams = new URLSearchParams(window.location.search);
        const id = urlParams.get('id');
        
        if (id) {
            // Try policy first, then bylaw
            loadPolicyDetail().catch(() => {
                // If policy fails, try bylaw
                loadBylawDetail().catch(err => console.error('Error loading detail:', err));
            });
        }
    }
    
    // Populate suggestions dropdown
    populateSuggestionsDropdown().catch(err => console.error('Error populating dropdown:', err));
    
    // Suggestion Form Handler
    if (suggestionForm) {
        suggestionForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const policySelect = document.getElementById('policySelect');
            const suggestionText = document.getElementById('suggestionText');
            const emailInput = document.getElementById('emailInput');
            
            const selectedPolicyId = policySelect.value;
            const suggestion = suggestionText.value.trim();
            const email = emailInput.value.trim();
            
            // Validation
            if (!email) {
                alert('Please enter your UAlberta email address');
                emailInput.focus();
                return;
            }
            
            if (!selectedPolicyId) {
                alert('Please select a policy to refer to.');
                policySelect.focus();
                return;
            }
            
            if (!suggestion) {
                alert('Please enter your suggestion.');
                suggestionText.focus();
                return;
            }

            if (!emailInput.value.includes('@ualberta.ca')) {
                alert('Please enter a valid UAlberta email address');
                emailInput.focus();
                return;
            }
            
            try {
                // Submit suggestion to API
                await asaAPI.suggestions.createSuggestion({
                    policy_id: selectedPolicyId,
                    suggestion: suggestion,
                    email: email
                });
            
                // Show success message
                alert('Thank you for your suggestion!\n\nYour feedback has been submitted successfully.');
                
                // Reset form
                policySelect.value = '';
                suggestionText.value = '';
                emailInput.value = '';
                
                showSuccessMessage();
            } catch (error) {
                console.error('Error submitting suggestion:', error);
                alert('Error submitting suggestion. Please try again later.\n\nError: ' + (error.message || 'Unknown error'));
            }
        });
    }
});

/**
 * Completed by Dominic del Rosario, 
 * Displays a success message after submitting a suggestion.
 * Creates the message element if it doesn't exist and automatically hides it after 5 seconds.
 * @returns {void}
 */
function showSuccessMessage() {
    // Create success message if it doesn't exist
    let successMsg = document.querySelector('.success-message');
    if (!successMsg) {
        successMsg = document.createElement('div');
        successMsg.className = 'success-message';
        successMsg.textContent = 'Thank you for your suggestion! Your feedback has been submitted successfully.';
        
        const form = document.getElementById('suggestionForm');
        if (form && form.parentNode) {
            form.parentNode.insertBefore(successMsg, form);
        }
    }
    
    successMsg.classList.add('show');
    
    // Hide after 5 seconds
    setTimeout(() => {
        successMsg.classList.remove('show');
    }, 5000);
}
