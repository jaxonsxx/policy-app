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
 * Retrieves all policies from localStorage.
 * @returns {Array<Object>} An array of policy objects, or an empty array if none exist.
 */
function getPolicies() {
    const stored = localStorage.getItem(STORAGE_KEYS.POLICIES);
    return stored ? JSON.parse(stored) : [];
}

/**
 * Retrieves all bylaws from localStorage.
 * @returns {Array<Object>} An array of bylaw objects, or an empty array if none exist.
 */
function getBylaws() {
    const stored = localStorage.getItem(STORAGE_KEYS.BYLAWS);
    return stored ? JSON.parse(stored) : [];
}

/**
 * Retrieves only approved policies from localStorage.
 * @returns {Array<Object>} An array of approved policy objects.
 */
function getApprovedPolicies() {
    const policies = getPolicies();
    return policies.filter(p => p.status === 'approved');
}

/**
 * Retrieves only approved bylaws from localStorage.
 * @returns {Array<Object>} An array of approved bylaw objects.
 */
function getApprovedBylaws() {
    const bylaws = getBylaws();
    return bylaws.filter(b => b.status === 'approved');
}

// State
let openSections = [1, 2, 3]; // Start with all sections open
let searchTerm = "";
let bylawSearchTerm = "";

/**
 * Renders all policy sections with their cards in the sections container.
 * Filters policies based on the current search term and groups them by section.
 * @returns {void}
 */
function renderSections() {
    const container = document.getElementById('sectionsContainer');
    if (!container) return;
    
    container.innerHTML = '';

    // Get approved policies from localStorage
    const approvedPolicies = getApprovedPolicies();
    
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
    window.location.href = `/public/policy-detail.html?id=${item.id}`;
}

/**
 * Completed by Dominic del Rosario, 
 * Handles search input events for filtering policies.
 * Opens all sections when a search term is entered.
 * @param {Event} e - The input event object.
 * @returns {void}
 */
function handleSearch(e) {
    searchTerm = e.target.value;
    
    // Open all sections when searching
    if (searchTerm !== '') {
        openSections = [1, 2, 3];
    }
    
    renderSections();
}

/**
 * Renders all bylaw cards in the bylaws container.
 * Filters bylaws based on the current search term.
 * @returns {void}
 */
function renderBylaws() {
    const container = document.getElementById('bylawsContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Get approved bylaws from localStorage
    const approvedBylaws = getApprovedBylaws();
    
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
    window.location.href = `/public/bylaw-detail.html?id=${bylaw.id}`;
}

/**
 * Completed by Dominic del Rosario, 
 * Handles search input events for filtering bylaws.
 * @param {Event} e - The input event object.
 * @returns {void}
 */
function handleBylawSearch(e) {
    bylawSearchTerm = e.target.value;
    renderBylaws();
}

/**
 * Loads and displays policy detail information on the policy detail page.
 * Retrieves policy data from localStorage and updates the page content.
 * @returns {void}
 */
function loadPolicyDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const policyId = urlParams.get('id');
    
    if (!policyId) {
        document.querySelector('.policy-detail-container').innerHTML = '<div class="no-results">Policy not found</div>';
        return;
    }
    
    const policies = getPolicies();
    const policy = policies.find(p => p.id === policyId);
    
    if (!policy || policy.status !== 'approved') {
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
    updatePolicySidebar(policy);
}

/**
 * Loads and displays bylaw detail information on the bylaw detail page.
 * Retrieves bylaw data from localStorage and updates the page content.
 * @returns {void}
 */
function loadBylawDetail() {
    const urlParams = new URLSearchParams(window.location.search);
    const bylawId = urlParams.get('id');
    
    if (!bylawId) {
        document.querySelector('.policy-detail-container').innerHTML = '<div class="no-results">Bylaw not found</div>';
        return;
    }
    
    const bylaws = getBylaws();
    const bylaw = bylaws.find(b => b.id === bylawId);
    
    if (!bylaw || bylaw.status !== 'approved') {
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
    updateBylawSidebar(bylaw);
}

/**
 * Updates the policy sidebar with links to other approved policies.
 * Groups policies by section and excludes the current policy.
 * @param {Object} currentPolicy - The currently displayed policy object.
 * @returns {void}
 */
function updatePolicySidebar(currentPolicy) {
    const sidebar = document.querySelector('.policy-sidebar');
    if (!sidebar) return;
    
    const approvedPolicies = getApprovedPolicies();
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
            html += `<a href="/public/policy-detail.html?id=${policy.id}" class="sidebar-link-small">${policyId} - ${name}</a>`;
        });
        html += `</div>`;
    });
    
    sidebar.innerHTML = html;
}

/**
 * Updates the bylaw sidebar with links to other approved bylaws.
 * Excludes the current bylaw from the list.
 * @param {Object} currentBylaw - The currently displayed bylaw object.
 * @returns {void}
 */
function updateBylawSidebar(currentBylaw) {
    const sidebar = document.querySelector('.policy-sidebar');
    if (!sidebar) return;
    
    const approvedBylaws = getApprovedBylaws();
    const otherBylaws = approvedBylaws.filter(b => b.id !== currentBylaw.id);
    
    if (otherBylaws.length === 0) {
        sidebar.innerHTML = '<h3 class="sidebar-title">Other Bylaws</h3><div class="sidebar-section"><p>No other bylaws available</p></div>';
        return;
    }
    
    let html = '<h3 class="sidebar-title">Other Bylaws</h3><div class="sidebar-section">';
    otherBylaws.forEach(bylaw => {
        const title = bylaw.title || bylaw.bylawTitle || 'Untitled';
        const number = bylaw.number || bylaw.bylawNumber || '';
        html += `<a href="/public/bylaw-detail.html?id=${bylaw.id}" class="sidebar-link">Bylaw #${number} - ${title}</a>`;
    });
    html += '</div>';
    
    sidebar.innerHTML = html;
}

/**
 * Populates the suggestions form dropdown with approved policies.
 * Groups policies by section for better organization.
 * @returns {void}
 */
function populateSuggestionsDropdown() {
    const policySelect = document.getElementById('policySelect');
    if (!policySelect) return;
    
    const approvedPolicies = getApprovedPolicies();
    
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
        renderSections();
    } else if (bylawsContainer) {
        // Bylaws page
        if (searchInput) {
            searchInput.addEventListener('input', handleBylawSearch);
        }
        renderBylaws();
        
        // Download PDF button handler
        const downloadBtn = document.querySelector('.download-pdf-btn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => {
                console.log('Download PDF clicked');
                // You can implement PDF download functionality here
            });
        }
    } else if (policyDetailContainer) {
        // Check if it's a policy or bylaw detail page
        const urlParams = new URLSearchParams(window.location.search);
        const id = urlParams.get('id');
        
        if (id) {
            const policies = getPolicies();
            const bylaws = getBylaws();
            const isPolicy = policies.some(p => p.id === id);
            const isBylaw = bylaws.some(b => b.id === id);
            
            if (isPolicy) {
                loadPolicyDetail();
            } else if (isBylaw) {
                loadBylawDetail();
            }
        }
    }
    
    // Populate suggestions dropdown
    populateSuggestionsDropdown();
    
    // Suggestion Form Handler
    if (suggestionForm) {
        suggestionForm.addEventListener('submit', function(e) {
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
            
            // Get existing suggestions
            const existingSuggestions = JSON.parse(localStorage.getItem(STORAGE_KEYS.SUGGESTIONS) || '[]');
            
            // Create new suggestion
            const newSuggestion = {
                id: 'suggestion_' + Date.now(),
                policyId: selectedPolicyId,
                suggestion: suggestion,
                status: 'pending',
                createdAt: new Date().toISOString()
            };
            
            // Add to suggestions
            existingSuggestions.push(newSuggestion);
            localStorage.setItem(STORAGE_KEYS.SUGGESTIONS, JSON.stringify(existingSuggestions));
            
            // Show success message
            alert('Thank you for your suggestion!\n\nYour feedback has been submitted successfully.');
            
            // Reset form
            policySelect.value = '';
            suggestionText.value = '';
            emailInput.value = '';
            
            showSuccessMessage();
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
