const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs'); 

const app = express();
const PORT = 5000; 

app.use(cors()); 
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 

const UPLOADS_DIR = path.join(__dirname, 'uploads'); 
const FOLDERS_METADATA_FILE = path.join(__dirname, 'folders.json'); 


if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR);
}


if (!fs.existsSync(FOLDERS_METADATA_FILE)) {
    fs.writeFileSync(FOLDERS_METADATA_FILE, JSON.stringify([]));
} else {
    
    try {
        JSON.parse(fs.readFileSync(FOLDERS_METADATA_FILE, 'utf8'));
    } catch (e) {
        console.warn('folders.json is corrupted, re-initializing.');
        fs.writeFileSync(FOLDERS_METADATA_FILE, JSON.stringify([]));
    }
}


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, UPLOADS_DIR); 
    },
    filename: function (req, file, cb) {
     
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage: storage });


/**
 * @route 
 * @description 
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
        path: file.path.replace(__dirname, '').replace(/\\/g, '/'), // Relative path
        uploadedAt: new Date().toISOString()
    }));

    console.log('Files uploaded successfully:', uploadedFiles);
    res.status(200).json({
        message: 'Files uploaded successfully',
        files: uploadedFiles
    });
});

/**
 * @route 
 * @description 
 */
app.post('/api/create-folder', (req, res) => {
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ message: 'Folder name is required.' });
    }

    const newFolderPath = path.join(UPLOADS_DIR, name);

    
    const existingFolders = fs.readdirSync(UPLOADS_DIR, { withFileTypes: true })
                               .filter(dirent => dirent.isDirectory())
                               .map(dirent => dirent.name.toLowerCase());

    if (existingFolders.includes(name.toLowerCase())) {
        return res.status(409).json({ message: `Folder "${name}" already exists.` });
    }

    try {
        fs.mkdirSync(newFolderPath);

       
        let folders = JSON.parse(fs.readFileSync(FOLDERS_METADATA_FILE, 'utf8'));
        const newFolder = {
            id: Date.now().toString(), 
            name: name,
            createdAt: new Date().toISOString()
        };
        folders.push(newFolder);
        fs.writeFileSync(FOLDERS_METADATA_FILE, JSON.stringify(folders, null, 2));

        console.log(`Folder "${name}" created successfully at ${newFolderPath}`);
        res.status(201).json({
            message: `Folder "${name}" created successfully.`,
            folder: newFolder
        });
    } catch (error) {
        console.error('Error creating folder:', error);
        res.status(500).json({ message: 'Failed to create folder.', error: error.message });
    }
});

/**
 * @route 
 * @description 
 */
app.get('/api/files-and-folders', (req, res) => {
    try {
        const items = [];
        const filesAndFolders = fs.readdirSync(UPLOADS_DIR, { withFileTypes: true });

        filesAndFolders.forEach(dirent => {
            const fullPath = path.join(UPLOADS_DIR, dirent.name);
            const stats = fs.statSync(fullPath);

            if (dirent.isFile()) {
                items.push({
                    name: dirent.name,
                    type: 'file',
                    size: stats.size,
                    createdAt: stats.birthtime.toISOString(),
                    path: `/uploads/${dirent.name}` 
                });
            } else if (dirent.isDirectory()) {
                 items.push({
                    name: dirent.name,
                    type: 'folder',
                    createdAt: stats.birthtime.toISOString(),
                 });
            }
        });
        res.status(200).json(items);
    } catch (error) {
        console.error('Error listing files and folders:', error);
        res.status(500).json({ message: 'Failed to list files and folders.', error: error.message });
    }
});



app.use('/uploads', express.static(UPLOADS_DIR));



app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Uploads directory: ${UPLOADS_DIR}`);
});