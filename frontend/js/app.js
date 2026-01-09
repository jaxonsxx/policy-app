// Data structure
const sections = [
    {
        id: 1,
        title: "Section 1",
        items: [
            { id: "1.1.1", title: "Section 1.1.1", subtitle: "Vision Statement" },
            { id: "1.1.2", title: "Section 1.1.2", subtitle: "Mission Statement" },
            { id: "1.1.3", title: "Section 1.1.3", subtitle: "Code of Conduct" }
        ]
    },
    {
        id: 2,
        title: "Section 2",
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
        title: "Section 3",
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
    alert(`Clicked on ${item.title}\n${item.subtitle}`);
}

function handleSearch(e) {
    searchTerm = e.target.value;
    
    // Open all sections when searching
    if (searchTerm !== '') {
        openSections = sections.map(s => s.id);
    }
    
    renderSections();
}

// Initialize
document.getElementById('searchInput').addEventListener('input', handleSearch);
renderSections();