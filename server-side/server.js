const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 5000;

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Base directory for all user data (files and folders)
const BASE_DIR = path.join(__dirname, 'user_data');

// Create base directory if it doesn't exist
if (!fs.existsSync(BASE_DIR)) {
    fs.mkdirSync(BASE_DIR);
}

// Multer storage configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Get the current path from the request body or query params
        // Default to root if no path provided
        const currentPath = req.body.currentPath || req.query.currentPath || '';
        const targetDir = path.join(BASE_DIR, currentPath);

        // Ensure the target directory exists
        if (!fs.existsSync(targetDir)) {
            // Recursively create directories if they don't exist
            fs.mkdirSync(targetDir, { recursive: true });
        }
        cb(null, targetDir);
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage: storage });

// --- Helper function to get directory contents ---
const getDirectoryContents = (currentPath = '') => {
    const fullPath = path.join(BASE_DIR, currentPath);
    if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isDirectory()) {
        throw new Error('Directory not found or is not a directory.');
    }

    const items = [];
    const filesAndFolders = fs.readdirSync(fullPath, { withFileTypes: true });

    filesAndFolders.forEach(dirent => {
        const itemFullPath = path.join(fullPath, dirent.name);
        const stats = fs.statSync(itemFullPath);
        const relativePath = path.join(currentPath, dirent.name).replace(/\\/g, '/');

        if (dirent.isFile()) {
            items.push({
                name: dirent.name,
                type: 'file',
                size: stats.size,
                createdAt: stats.birthtime.toISOString(),
                // URL path for direct access, relative to the server's static route
                path: `/user_data/${relativePath}`
            });
        } else if (dirent.isDirectory()) {
             items.push({
                name: dirent.name,
                type: 'folder',
                createdAt: stats.birthtime.toISOString(),
                path: relativePath // Path for navigation within the frontend
             });
        }
    });
    return items;
};


// --- Routes ---

/**
 * @route POST /api/upload
 * @description Uploads one or more files to the server in a specified path.
 * Requires `currentPath` in form data.
 */
app.post('/api/upload', upload.array('files'), (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'No files uploaded.' });
    }

    const uploadedFiles = req.files.map(file => ({
        filename: file.filename,
        originalname: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        path: file.path.replace(BASE_DIR, '/user_data').replace(/\\/g, '/'), // Relative URL path for frontend
        uploadedAt: new Date().toISOString()
    }));

    console.log('Files uploaded successfully:', uploadedFiles);
    res.status(200).json({
        message: 'Files uploaded successfully',
        files: uploadedFiles
    });
});

/**
 * @route POST /api/create-folder
 * @description Creates a new folder in a specified path.
 * Requires `name` and `currentPath` in JSON body.
 */
app.post('/api/create-folder', (req, res) => {
    const { name, currentPath = '' } = req.body; // Default to root path

    if (!name) {
        return res.status(400).json({ message: 'Folder name is required.' });
    }

    const parentPath = path.join(BASE_DIR, currentPath);
    const newFolderPath = path.join(parentPath, name);

    // Ensure parent directory exists
    if (!fs.existsSync(parentPath) || !fs.statSync(parentPath).isDirectory()) {
        return res.status(400).json({ message: 'Invalid parent path.' });
    }

    // Check if a folder with this name already exists in the target directory
    const existingItems = fs.readdirSync(parentPath, { withFileTypes: true });
    const folderExists = existingItems.some(dirent =>
        dirent.isDirectory() && dirent.name.toLowerCase() === name.toLowerCase()
    );

    if (folderExists) {
        return res.status(409).json({ message: `Folder "${name}" already exists in this location.` });
    }

    try {
        fs.mkdirSync(newFolderPath);

        // For a more robust app, you'd store this in a database
        // For now, simply confirming creation
        console.log(`Folder "${name}" created successfully at ${newFolderPath}`);
        res.status(201).json({
            message: `Folder "${name}" created successfully.`,
            folder: {
                name: name,
                type: 'folder',
                createdAt: new Date().toISOString(),
                path: path.join(currentPath, name).replace(/\\/g, '/')
            }
        });
    } catch (error) {
        console.error('Error creating folder:', error);
        res.status(500).json({ message: 'Failed to create folder.', error: error.message });
    }
});

/**
 * @route GET /api/files-and-folders
 * @description Retrieves a list of all files and folders for a given path.
 * Accepts optional `currentPath` query parameter.
 * Example: /api/files-and-folders?currentPath=my_folder/sub_folder
 */
app.get('/api/files-and-folders', (req, res) => {
    const currentPath = req.query.currentPath || ''; // Get currentPath from query
    try {
        const items = getDirectoryContents(currentPath);
        res.status(200).json(items);
    } catch (error) {
        console.error('Error listing files and folders:', error);
        res.status(500).json({ message: 'Failed to list files and folders.', error: error.message });
    }
});


// Serve static files from the 'user_data' directory
app.use('/user_data', express.static(BASE_DIR));


// --- Start Server ---
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Base data directory: ${BASE_DIR}`);
});