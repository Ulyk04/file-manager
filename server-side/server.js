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


const BASE_DIR = path.join(__dirname, 'user_data');
const TRASH_DIR = path.join(BASE_DIR, '.trash_');


if (!fs.existsSync(BASE_DIR)) {
    fs.mkdirSync(BASE_DIR);
    console.log(`Created BASE_DIR: ${BASE_DIR}`);
}
if (!fs.existsSync(TRASH_DIR)) {
    fs.mkdirSync(TRASH_DIR);
    console.log(`Created TRASH_DIR: ${TRASH_DIR}`);
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
     
        console.log('--- Multer Destination Debug ---');
        console.log('req.body:', req.body);
        console.log('req.query:', req.query);
        console.log('File originalname:', file.originalname);

        
        const currentPath = req.body.currentPath ? String(req.body.currentPath) : ''; 
        const sanitizedPath = path.normalize(currentPath).replace(/^(\.\.(\/|\\|$))+/, ''); 
        
        console.log('Current Path received (raw):', currentPath);
        console.log('Current Path sanitized:', sanitizedPath);

        
        const targetDir = path.join(BASE_DIR, sanitizedPath);
        console.log('BASE_DIR:', BASE_DIR);
        console.log('Calculated Target Directory:', targetDir);

        
        if (!fs.existsSync(targetDir)) {
            console.log(`Target directory "${targetDir}" does not exist. Creating...`);
            try {
                fs.mkdirSync(targetDir, { recursive: true });
                console.log(`Successfully created directory: ${targetDir}`);
            } catch (err) {
                console.error(`ERROR: Failed to create directory "${targetDir}":`, err);
                return cb(new Error(`Failed to create directory: ${err.message}`));
            }
        } else {
            console.log(`Target directory "${targetDir}" already exists.`);
        }

        cb(null, targetDir); 
    },
    filename: function (req, file, cb) {
        
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `${uniqueSuffix}-${file.originalname}`);
    }
});

const upload = multer({ storage: storage });

const getDirectoryContents = (currentPath = '') => {
    const fullPath = path.join(BASE_DIR, currentPath);
    if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isDirectory()) {
        throw new Error('Directory not found or is not a directory.');
    }

    const items = [];
    const filesAndFolders = fs.readdirSync(fullPath, { withFileTypes: true });

    filesAndFolders.forEach(dirent => {
        if (dirent.name === path.basename(TRASH_DIR)) {
            return; 
        }

        const itemFullPath = path.join(fullPath, dirent.name);
        const metadata = getFileMetadata(itemFullPath, dirent.name);
        
        if (metadata) {
            metadata.createdAt = metadata.createdAt.toISOString();
            metadata.modifiedAt = metadata.modifiedAt.toISOString();
            items.push(metadata);
        }
    });
    return items;
};

const getFileMetadata = (filePath, fileName) => {
    try {
        const stats = fs.statSync(filePath);
        const relativePath = filePath.substring(BASE_DIR.length).replace(/\\/g, '/');
        const cleanedRelativePath = relativePath.startsWith('/') ? relativePath.substring(1) : relativePath;

        return {
            name: fileName,
            path: cleanedRelativePath, 
            type: stats.isDirectory() ? 'folder' : 'file',
            size: stats.isDirectory() ? 0 : stats.size,
            createdAt: stats.birthtime, 
            modifiedAt: stats.mtime,     
        };
    } catch (error) {
        console.error(`Error getting metadata for ${filePath}:`, error);
        return null; 
    }
};



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
        path: file.path.replace(BASE_DIR, '/user_data').replace(/\\/g, '/'), 
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
    const { name, currentPath = '' } = req.body;

    if (!name) {
        return res.status(400).json({ message: 'Folder name is required.' });
    }

    const parentPath = path.join(BASE_DIR, currentPath);
    const newFolderPath = path.join(parentPath, name);

    
    if (!fs.existsSync(parentPath) || !fs.statSync(parentPath).isDirectory()) {
        return res.status(400).json({ message: 'Invalid parent path.' });
    }

   
    const existingItems = fs.readdirSync(parentPath, { withFileTypes: true });
    const folderExists = existingItems.some(dirent =>
        dirent.isDirectory() && dirent.name.toLowerCase() === name.toLowerCase()
    );

    if (folderExists) {
        return res.status(409).json({ message: `Folder "${name}" already exists in this location.` });
    }

    try {
        fs.mkdirSync(newFolderPath);

     
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
 * @route 
 * @description .
 */

app.get('/api/files-and-folders', (req, res) => {
    const currentPath = req.query.currentPath || ''; 
    const absolutePath = path.join(BASE_DIR, currentPath);

    if (!fs.existsSync(absolutePath)) {
        
        return res.status(404).json({ message: 'Directory not found.' });
    }

    try {
        const items = getDirectoryContents(currentPath);
        
        res.status(200).json(items); 
        
       
    } catch (error) {
        console.error('Error listing files and folders:', error);
        return res.status(500).json({ message: 'Failed to list files and folders.', error: error.message });
    }
});

app.post('/api/move-to-trash', (req, res) => {
    const { path: itemPath } = req.body; 

    if (!itemPath) {
        return res.status(400).json({ message: 'Item path is required.' });
    }

    const sourcePath = path.join(BASE_DIR, itemPath);
    const targetPath = path.join(TRASH_DIR, path.basename(sourcePath)); 

    if (!fs.existsSync(sourcePath)) {
        return res.status(404).json({ message: 'Item not found.' });
    }

    try {
        
        let finalTargetPath = targetPath;
        let counter = 1;
        const originalBaseName = path.basename(targetPath);
        const originalExt = path.extname(originalBaseName);
        const originalNameWithoutExt = path.basename(originalBaseName, originalExt);

        while (fs.existsSync(finalTargetPath)) {
            
            finalTargetPath = path.join(TRASH_DIR, `${originalNameWithoutExt} (${counter})${originalExt}`);
            counter++;
        }

        fs.renameSync(sourcePath, finalTargetPath); 
        console.log(`Moved "${itemPath}" to trash: ${finalTargetPath}`);
        return res.status(200).json({ message: 'Item moved to trash successfully.', newPath: finalTargetPath });
    } catch (error) {
        console.error('Error moving item to trash:', error);
        return res.status(500).json({ message: 'Failed to move item to trash.', error: error.message });
    }
});


app.get('/api/recent-files', (req, res) => {
    try {
      

        let allFiles = [];

        const walkDir = (dir) => {
            const files = fs.readdirSync(dir);
            for (const file of files) {
                const filePath = path.join(dir, file);
                const stats = fs.statSync(filePath);

                if (filePath === TRASH_DIR || filePath.startsWith(TRASH_DIR + path.sep)) {
                    continue; 
                }

                if (stats.isDirectory()) {
                    walkDir(filePath); 
                } else {
                    const metadata = getFileMetadata(filePath, file);
                    if (metadata) {
                        allFiles.push(metadata);
                    }
                }
            }
        };

        walkDir(BASE_DIR);

    
        const recentFiles = allFiles
            .sort((a, b) => b.modifiedAt.getTime() - a.modifiedAt.getTime())
            .map(file => ({
                ...file,
                createdAt: file.createdAt.toISOString(),
                modifiedAt: file.modifiedAt.toISOString(),
            }));
        
        res.json(recentFiles.slice(0, 50)); 

    } catch (error) {
        console.error("Error fetching recent files:", error);
        res.status(500).json({ message: 'Failed to retrieve recent files.' });
    }
});

app.get('/api/shared-files', (req, res) => {
   
    console.log("Fetching shared files (placeholder)");
    res.json([]); 
   
});

app.get('/api/trash-files', (req, res) => {
    if (!fs.existsSync(TRASH_DIR)) { 
        console.log(`Trash directory not found: ${TRASH_DIR}`);
        return res.json([]);
    }

    try {
        const filesInTrash = fs.readdirSync(TRASH_DIR);
        const trashFileList = filesInTrash.map(file => {
            const filePath = path.join(TRASH_DIR, file);
            const metadata = getFileMetadata(filePath, file);
            if (metadata) {
                const trashRelativePath = path.join(path.basename(TRASH_DIR), file).replace(/\\/g, '/');
                return {
                    ...metadata,
                    path: trashRelativePath, 
                    createdAt: metadata.createdAt.toISOString(),
                    modifiedAt: metadata.modifiedAt.toISOString(),
                };
            }
            return null;
        }).filter(Boolean); 
        
        return res.json(trashFileList);
    } catch (error) {
        console.error("Error fetching trash files:", error);
        return res.status(500).json({ message: 'Failed to retrieve trash files.' });
    }
});

app.use('/user_data', express.static(BASE_DIR));



app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Base data directory: ${BASE_DIR}`);
    console.log(`Trash directory: ${TRASH_DIR}`);
});