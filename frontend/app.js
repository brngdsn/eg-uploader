// frontend/app.js
let csrfToken = '';

async function fetchCsrfToken() {
  const response = await fetch('/csrf-token', {
    credentials: 'include',
  });
  const data = await response.json();
  csrfToken = data.csrfToken;
}

function getCsrfToken() {
  return csrfToken;
}

const app = document.getElementById('app');

function showLandingPage() {
  app.innerHTML = `
    <section class="hero">
      <h1>Welcome to Secure Web App</h1>
      <p>Your secure solution for file management.</p>
      <div class="cta-buttons">
        <button id="upload-button">Upload Files</button>
        <button id="view-files-button">View Files</button>
      </div>
    </section>
  `;

  document.getElementById('upload-button').addEventListener('click', () => {
    checkAuthentication(showUploadForm);
  });

  document.getElementById('view-files-button').addEventListener('click', () => {
    checkAuthentication(showFileList);
  });
}

function checkAuthentication(callback) {
  fetch('/auth/check', {
    credentials: 'include',
  })
    .then(response => {
      if (response.ok) {
        callback();
      } else {
        showLoginForm();
      }
    })
    .catch(() => showLoginForm());
}

function showLoginForm() {
  app.innerHTML = `
    <form id="login-form">
      <h2>Login</h2>
      <input type="text" name="username" placeholder="Username" required/>
      <input type="password" name="password" placeholder="Password" required/>
      <button type="submit">Login</button>
    </form>
  `;

  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    const response = await fetch('/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'CSRF-Token': getCsrfToken(),
      },
      body: JSON.stringify(Object.fromEntries(data)),
      credentials: 'include',
    });
    if (response.ok) {
      updateNavLinks(true);
      showLandingPage();
    } else {
      const errorData = await response.json();
      alert('Login failed: ' + errorData.message);
    }
  });
}

function showRegisterForm() {
  app.innerHTML = `
    <form id="register-form">
      <h2>Register</h2>
      <input type="text" name="username" placeholder="Username" required/>
      <input type="password" name="password" placeholder="Password" required/>
      <button type="submit">Register</button>
    </form>
  `;

  document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    const response = await fetch('/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'CSRF-Token': getCsrfToken(),
      },
      body: JSON.stringify(Object.fromEntries(data)),
      credentials: 'include',
    });
    if (response.ok) {
      alert('Registration successful. Please log in.');
      showLoginForm();
    } else {
      const errorData = await response.json();
      alert('Registration failed: ' + errorData.message);
    }
  });
}

function showUploadForm() {
  app.innerHTML = `
    <form id="upload-form">
      <h2>Upload File</h2>
      <input type="file" name="file" required/>
      <button type="submit">Upload File</button>
    </form>
  `;

  document.getElementById('upload-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    const response = await fetch('/files/upload', {
      method: 'POST',
      headers: {
        'CSRF-Token': getCsrfToken(),
      },
      body: data,
      credentials: 'include',
    });
    if (response.ok) {
      alert('File uploaded successfully');
      showFileList();
    } else {
      const errorData = await response.json();
      alert('Upload failed: ' + errorData.message);
    }
  });
}

function showFileList() {
  app.innerHTML = `
    <section>
      <h2>Your Files</h2>
      <table id="file-table">
        <thead>
          <tr>
            <th>Filename</th>
            <th>Size</th>
            <th>Extension</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody id="file-list">
          <!-- File rows will be inserted here -->
        </tbody>
      </table>
      <button id="back-button">Back to Home</button>
    </section>
  `;

  fetchFiles();

  document.getElementById('back-button').addEventListener('click', () => {
    showLandingPage();
  });
}

async function fetchFiles() {
  const response = await fetch('/files', {
    credentials: 'include',
  });
  if (response.ok) {
    const data = await response.json();
    const fileList = document.getElementById('file-list');
    if (data.files.length === 0) {
      fileList.innerHTML = `<tr><td colspan="4">No files uploaded yet.</td></tr>`;
    } else {
      fileList.innerHTML = data.files
        .map(file => `
          <tr>
            <td>${file.originalName}</td>
            <td>${formatFileSize(file.size)}</td>
            <td>${file.extension}</td>
            <td>
              <button class="download-button" data-storedname="${file.storedName}">Download</button>
            </td>
          </tr>
        `)
        .join('');
      // Add event listeners to download buttons
      document.querySelectorAll('.download-button').forEach(button => {
        button.addEventListener('click', e => {
          const storedName = e.target.getAttribute('data-storedname');
          downloadFile(storedName);
        });
      });
    }
  } else {
    const errorData = await response.json();
    alert('Failed to fetch files: ' + errorData.message);
  }
}

function formatFileSize(bytes) {
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i];
}

function downloadFile(storedName) {
  const link = document.createElement('a');
  link.href = `/files/download/${encodeURIComponent(storedName)}`;
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ... Rest of the code ...


function updateNavLinks(isLoggedIn) {
  document.getElementById('login-link').style.display = isLoggedIn ? 'none' : 'inline';
  document.getElementById('register-link').style.display = isLoggedIn ? 'none' : 'inline';
  document.getElementById('logout-link').style.display = isLoggedIn ? 'inline' : 'none';
}

async function handleLogout() {
  await fetch('/auth/logout', {
    method: 'POST',
    headers: {
      'CSRF-Token': getCsrfToken(),
    },
    credentials: 'include',
  });
  await fetchCsrfToken(); // Refresh CSRF token after logout
  updateNavLinks(false);
  showLandingPage();
}

function initializeNavLinks() {
  document.getElementById('login-link').addEventListener('click', (e) => {
    e.preventDefault();
    showLoginForm();
  });

  document.getElementById('register-link').addEventListener('click', (e) => {
    e.preventDefault();
    showRegisterForm();
  });

  document.getElementById('logout-link').addEventListener('click', (e) => {
    e.preventDefault();
    handleLogout();
  });
}

// Initialize App
(async () => {
  await fetchCsrfToken();
  initializeNavLinks();
  updateNavLinks(false);
  showLandingPage();
})();
