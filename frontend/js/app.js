// Data structure
const sections = [
    {
        id: 1,
        title: "Organizational Identity & Values",
        items: [
            { id: "1.1.1", title: "Section 1.1.1", subtitle: "Vision Statement" },
            { id: "1.1.2", title: "Section 1.1.2", subtitle: "Mission Statement" },
            { id: "1.1.3", title: "Section 1.1.3", subtitle: "Code of Conduct" }
        ]
    },
    {
        id: 2,
        title: "Governance & Elections",
        items: [
            { id: "2.1.0", title: "Section 2.1.0", subtitle: "Policy Making" },
            { id: "2.2.1", title: "Section 2.2.1", subtitle: "Type of Board" },
            { id: "2.2.2", title: "Section 2.2.2", subtitle: "Board Structure" },
            { id: "2.3.1", title: "Section 2.3.1", subtitle: "Proxy Voting" },
            { id: "2.3.2", title: "Section 2.3.2", subtitle: "Board Committees" },
            { id: "2.3.4", title: "Section 2.3.4", subtitle: "Executive Members" },
            { id: "2.3.5", title: "Section 2.3.5", subtitle: "Membership" },
            { id: "2.3.6", title: "Section 2.3.6", subtitle: "Council Member Description" },
            { id: "2.3.7", title: "Section 2.3.7", subtitle: "External Representation" },
            { id: "2.3.8", title: "Section 2.3.8", subtitle: "Faculty Liaison" }
        ]
    },
    {
        id: 3,
        title: "Operations, Staff & Finance",
        items: [
            { id: "3.1.1", title: "Section 3.1.1", subtitle: "Financial Policies" },
            { id: "3.1.2", title: "Section 3.1.2", subtitle: "Budget Allocation" },
            { id: "3.2.1", title: "Section 3.2.1", subtitle: "Expense Guidelines" },
            { id: "3.2.2", title: "Section 3.2.2", subtitle: "Reimbursement Process" },
            { id: "3.3.1", title: "Section 3.3.1", subtitle: "Audit Requirements" },
            { id: "3.3.2", title: "Section 3.3.2", subtitle: "Financial Reporting" }
        ]
    }
];

// State
let openSections = [1, 2, 3]; // Start with all sections open
let searchTerm = "";

// Render functions
function renderSections() {
    const container = document.getElementById('sectionsContainer');
    container.innerHTML = '';

    sections.forEach(section => {
        const filteredItems = section.items.filter(item => 
            item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.subtitle.toLowerCase().includes(searchTerm.toLowerCase())
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

function createCardElement(item) {
    const card = document.createElement('div');
    card.className = 'card';
    card.onclick = () => handleCardClick(item);
    
    card.innerHTML = `
        <div class="card-image"></div>
        <div class="card-title">${item.title}</div>
        <div class="card-subtitle">${item.subtitle}</div>
    `;
    
    return card;
}

// Event handlers
function toggleSection(sectionId) {
    const index = openSections.indexOf(sectionId);
    if (index > -1) {
        openSections.splice(index, 1);
    } else {
        openSections.push(sectionId);
    }
    renderSections();
}

function handleCardClick(item) {
    // Navigate to policy detail page with the item's id as a query parameter
    window.location.href = `/frontend/public/policy-detail.html?id=${item.id}`;
}

function handleSearch(e) {
    searchTerm = e.target.value;
    
    // Open all sections when searching
    if (searchTerm !== '') {
        openSections = sections.map(s => s.id);
    }
    
    renderSections();
}

// Bylaws Data
const bylaws = [
    { id: "definitions", title: "Definitions", subtitle: "Definition of Terms" },
    { id: "bylaw-1", title: "Bylaw #1", subtitle: "Name of the Organization" },
    { id: "bylaw-2", title: "Bylaw #2", subtitle: "Preparing/Keeping Records" },
    { id: "bylaw-3", title: "Bylaw #3", subtitle: "Membership" },
    { id: "bylaw-4", title: "Bylaw #4", subtitle: "General Meetings" },
    { id: "bylaw-5", title: "Bylaw #5", subtitle: "Student Council" },
    { id: "bylaw-6", title: "Bylaw #6", subtitle: "Duties of Student Council" },
    { id: "bylaw-7", title: "Bylaw #7", subtitle: "Elections" },
    { id: "bylaw-8", title: "Bylaw #8", subtitle: "Referenda" },
    { id: "bylaw-9", title: "Bylaw #9", subtitle: "Disciplining and Removal" },
    { id: "bylaw-10", title: "Bylaw #10", subtitle: "Finances" },
    { id: "bylaw-11", title: "Bylaw #11", subtitle: "Inspection of Records" },
    { id: "bylaw-12", title: "Bylaw #12", subtitle: "Corporate Seal" },
    { id: "bylaw-13", title: "Bylaw #13", subtitle: "Boards" },
    { id: "bylaw-14", title: "Bylaw #14", subtitle: "Clubs and Organizations" }
];

// Bylaws State
let bylawSearchTerm = "";

// Render Bylaws
function renderBylaws() {
    const container = document.getElementById('bylawsContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    const filteredBylaws = bylaws.filter(bylaw => 
        bylaw.title.toLowerCase().includes(bylawSearchTerm.toLowerCase()) ||
        bylaw.subtitle.toLowerCase().includes(bylawSearchTerm.toLowerCase())
    );
    
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

function createBylawCardElement(bylaw) {
    const card = document.createElement('div');
    card.className = 'card';
    card.onclick = () => handleBylawCardClick(bylaw);
    
    card.innerHTML = `
        <div class="card-image"></div>
        <div class="card-title">${bylaw.title}</div>
        <div class="card-subtitle">${bylaw.subtitle}</div>
    `;
    
    return card;
}

function handleBylawCardClick(bylaw) {
    // Navigate to bylaw detail page with the bylaw's id as a query parameter
    window.location.href = `/frontend/public/bylaw-detail.html?id=${bylaw.id}`;
}

function handleBylawSearch(e) {
    bylawSearchTerm = e.target.value;
    renderBylaws();
}

// Initialize
const searchInput = document.getElementById('searchInput');
if (searchInput) {
    // Check which page we're on
    const sectionsContainer = document.getElementById('sectionsContainer');
    const bylawsContainer = document.getElementById('bylawsContainer');
    
    if (sectionsContainer) {
        // Policies page
        searchInput.addEventListener('input', handleSearch);
        renderSections();
    } else if (bylawsContainer) {
        // Bylaws page
        searchInput.addEventListener('input', handleBylawSearch);
        renderBylaws();
        
        // Download PDF button handler
        const downloadBtn = document.querySelector('.download-pdf-btn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => {
                // Handle PDF download
                console.log('Download PDF clicked');
                // You can implement PDF download functionality here
                // window.open('/path/to/bylaws.pdf', '_blank');
            });
        }
    }
}

// Suggestion Form Handler

document.getElementById('suggestionForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const policySelect = document.getElementById('policySelect');
    const suggestionText = document.getElementById('suggestionText');
    
    const selectedPolicy = policySelect.value;
    const suggestion = suggestionText.value.trim();
    
    // Validation
    if (!selectedPolicy) {
        alert('Please select a policy to refer to.');
        policySelect.focus();
        return;
    }
    
    if (!suggestion) {
        alert('Please enter your suggestion.');
        suggestionText.focus();
        return;
    }
    
    // Here you would normally send the data to a server
    // For now, we'll just show a success message
    console.log('Suggestion submitted:', {
        policy: selectedPolicy,
        suggestion: suggestion,
        timestamp: new Date().toISOString()
    });
    
    // Show success message
    alert('Thank you for your suggestion!\n\nYour feedback has been submitted successfully.');
    
    // Reset form
    policySelect.value = '';
    suggestionText.value = '';
    
    // Optional: You could also create a success message element
    showSuccessMessage();
});

function showSuccessMessage() {
    // Create success message if it doesn't exist
    let successMsg = document.querySelector('.success-message');
    if (!successMsg) {
        successMsg = document.createElement('div');
        successMsg.className = 'success-message';
        successMsg.textContent = 'Thank you for your suggestion! Your feedback has been submitted successfully.';
        
        const form = document.getElementById('suggestionForm');
        form.parentNode.insertBefore(successMsg, form);
    }
    
    successMsg.classList.add('show');
    
    // Hide after 5 seconds
    setTimeout(() => {
        successMsg.classList.remove('show');
    }, 5000);
}