// --- Firebase Configuration ---
// IMPORTANT: Replace with your actual config
const firebaseConfig = {
    apiKey: "AIzaSyAZjiZWs8GmORTahBu4LP1FhFqTMWLSQlg",
    authDomain: "myportfolio-983e1.firebaseapp.com",
    projectId: "myportfolio-983e1",
    storageBucket: "myportfolio-983e1.firebasestorage.app",
    messagingSenderId: "791397613597",
    appId: "1:791397613597:web:0c74012e196df6f7ac06f4"
  };

// --- Initialize Firebase ---
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const projectsRef = database.ref('projects');

// --- DOM Elements ---
const projectsContainer = document.getElementById('projects-container');
const currentYearSpan = document.getElementById('current-year');
const projectDetailModal = document.getElementById('project-detail-modal');
const modalProjectContent = document.getElementById('modal-project-content');
const modalProjectImage = document.getElementById('modal-project-image');
const modalProjectTitle = document.getElementById('modal-project-title');
const modalProjectCategory = document.getElementById('modal-project-category');
const modalProjectDescription = document.getElementById('modal-project-description');
const modalCloseBtn = projectDetailModal ? projectDetailModal.querySelector('.project-modal-close') : null;

// --- State ---
let projectsDataCache = {}; // Cache fetched projects

// --- Functions ---

// Function to create a project card HTML
function createProjectCard(projectData, projectId) {
    const card = document.createElement('div');
    card.classList.add('project-card');
    card.dataset.id = projectId; // Store Firebase ID

    const img = document.createElement('img');
    img.src = projectData.imageUrl || 'https://via.placeholder.com/400x250.png?text=Project+Image';
    img.alt = projectData.title || 'Project Image';
    img.onerror = () => {
        img.src = 'https://via.placeholder.com/400x250.png?text=Image+Not+Found';
        console.warn(`Image failed to load for project: ${projectData.title}`);
    };
    img.loading = 'lazy'; // Add lazy loading

    const infoDiv = document.createElement('div');
    infoDiv.classList.add('project-info');

    const title = document.createElement('h3');
    title.textContent = projectData.title || 'Untitled Project';

    const description = document.createElement('p');
    // Limit description length on card if desired
    description.textContent = projectData.description ? (projectData.description.length > 100 ? projectData.description.substring(0, 97) + '...' : projectData.description) : 'No description.';

    infoDiv.appendChild(title);
    infoDiv.appendChild(description);
    card.appendChild(img);
    card.appendChild(infoDiv);

    // --- Add Click Listener for Modal ---
    card.addEventListener('click', () => {
        showProjectModal(projectId);
    });

    return card;
}

// Function to display projects from Firebase
function displayProjects(projectsData) {
    if (!projectsContainer) {
        console.error("Project container not found!");
        return;
    }
    projectsContainer.innerHTML = ''; // Clear loading/previous

    if (!projectsData) {
        projectsContainer.innerHTML = '<p class="loading-text">No projects added yet.</p>';
        return;
    }

    projectsDataCache = projectsData; // Update cache
    const projectIds = Object.keys(projectsData);

    if (projectIds.length === 0) {
        projectsContainer.innerHTML = '<p class="loading-text">No projects added yet.</p>';
        return;
    }

    projectIds.forEach((projectId, index) => {
        const project = projectsData[projectId];
        if (project && project.title && project.imageUrl) {
            const projectCard = createProjectCard(project, projectId);
             // Add delay for staggered animation via Intersection Observer
            projectCard.style.setProperty('--animation-delay', `${index * 0.1}s`);
            projectsContainer.appendChild(projectCard);
            // Observe the card for animation
            observeElement(projectCard);
        } else {
            console.warn(`Skipping project with invalid data (ID: ${projectId}):`, project);
        }
    });
}

// Function to show the project detail modal
function showProjectModal(projectId) {
    const project = projectsDataCache[projectId];
    if (!project || !projectDetailModal) return;

    modalProjectTitle.textContent = project.title || 'Untitled Project';
    modalProjectDescription.textContent = project.description || 'No description provided.';
    modalProjectCategory.textContent = project.category || 'General'; // Show category
    modalProjectCategory.style.display = project.category ? 'inline-block' : 'none'; // Hide if no category

    modalProjectImage.src = project.imageUrl || '';
    modalProjectImage.alt = project.title || 'Project Image';
    modalProjectImage.style.display = project.imageUrl ? 'block' : 'none'; // Hide img element if no URL
    modalProjectImage.onerror = () => {
         modalProjectImage.style.display = 'none'; // Hide if image fails
         console.warn("Modal image failed to load:", project.imageUrl);
    }


    projectDetailModal.style.display = 'block';
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

// Function to hide the project detail modal
function hideProjectModal() {
    if (!projectDetailModal) return;
    projectDetailModal.style.display = 'none';
    document.body.style.overflow = ''; // Restore background scrolling
    // Optional: Clear content to prevent flash of old content
    modalProjectImage.src = "";
    modalProjectTitle.textContent = "";
    modalProjectCategory.textContent = "";
    modalProjectDescription.textContent = "";

}

// --- Intersection Observer for Animations ---
const observerOptions = {
    threshold: 0.1, // Trigger when 10% visible
    // rootMargin: '0px 0px -50px 0px' // Optional: trigger slightly before fully in view
};

const elementObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
            // Optionally add a class: entry.target.classList.add('visible');
            observer.unobserve(entry.target); // Stop observing once animated
        }
    });
}, observerOptions);

function observeElement(element) {
    elementObserver.observe(element);
}

// Observe sections initially
document.querySelectorAll('section').forEach(section => observeElement(section));
// Project cards are observed when added in displayProjects

// --- Event Listeners & Initial Load ---

// Firebase listener
projectsRef.on('value', (snapshot) => {
    const projects = snapshot.val();
    displayProjects(projects);
}, (error) => {
    console.error("Error fetching projects: ", error);
    if (projectsContainer) {
        projectsContainer.innerHTML = '<p class="loading-text">Could not load projects. Please check connection or try again later.</p>';
    }
});

// Modal Close Button
if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', hideProjectModal);
}

// Close modal on outside click
if (projectDetailModal) {
    projectDetailModal.addEventListener('click', (event) => {
        if (event.target === projectDetailModal) { // Check if click is on the backdrop itself
            hideProjectModal();
        }
    });
}

// Close modal with Escape key
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && projectDetailModal && projectDetailModal.style.display === 'block') {
        hideProjectModal();
    }
});


// Set current year in footer
if (currentYearSpan) {
    currentYearSpan.textContent = new Date().getFullYear();
}