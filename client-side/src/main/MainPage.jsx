import * as React from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { createTheme } from '@mui/material/styles';
import FolderIcon from '@mui/icons-material/Folder';
import ScheduleIcon from '@mui/icons-material/Schedule';
import ShareIcon from '@mui/icons-material/Share';
import DeleteIcon from '@mui/icons-material/Delete';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import ArrowBackIcon from '@mui/icons-material/ArrowBack'; 
import { AppProvider } from '@toolpad/core/AppProvider';
import { DashboardLayout } from '@toolpad/core/DashboardLayout';
import { DemoProvider, useDemoRouter } from '@toolpad/core/internal';
import {
    Button, Stack, Input, TextField, Dialog, DialogTitle, DialogContent,
    DialogActions, List, ListItem, ListItemText, ListItemIcon,
    CircularProgress, Breadcrumbs, Link as MuiLink , IconButton
} from '@mui/material';

const NAVIGATION = [
    {
        kind: 'header',
        title: 'Navigation',
    },
    {
        segment: 'allfiles',
        title: 'All Files',
        icon: <FolderIcon />,
    },
    {
        segment: 'recent',
        title: 'Recent',
        icon: <ScheduleIcon />,
    },
    {
        segment: 'shared',
        title: 'Shared',
        icon: <ShareIcon />,
    },
    {
        segment: 'trash',
        title: 'Trash',
        icon: <DeleteIcon />,
    }
];

const demoTheme = createTheme({
    cssVariables: {
        colorSchemeSelector: 'data-toolpad-color-scheme',
    },
    colorSchemes: {
        light: {
            palette: {
                primary: { main: '#000000' },
                secondary: { main: '#ffffff' },
                background: { default: '#ffffff', paper: '#ffffff' },
                text: { primary: 'black', secondary: 'black' },
                custom: { mainBackground: '#ffffff' }
            },
        },
        dark: {
            palette: {
                primary: { main: '#ffffff' },
                secondary: { main: '#000000' },
                background: { default: '#00000', paper: '#000000' },
                text: { primary: '#ffffff', secondary: '#00000' },
                custom: { mainBackground: '#343a40' }
            },
        },
    },
    breakpoints: {
        values: {
            xs: 0, sm: 600, md: 600, lg: 1200, xl: 1536,
        },
    },
});

function AllFilesContent({ filesAndFolders, isLoading, error, currentPath, onNavigate, onGoBack , onDeleteItem}) {
    
    const pathParts = currentPath.split('/').filter(Boolean); 
    const breadcrumbs = [
        <MuiLink
            key="root"
            underline="hover"
            color="inherit"
            href="#"
            onClick={() => onNavigate('')} 
        >
            Home
        </MuiLink>,
        ...pathParts.map((part, index) => {
            const pathSegment = pathParts.slice(0, index + 1).join('/');
            const isLast = index === pathParts.length - 1;
            return isLast ? (
                <Typography key={pathSegment} color="text.primary">
                    {part}
                </Typography>
            ) : (
                <MuiLink
                    key={pathSegment}
                    underline="hover"
                    color="inherit"
                    href="#"
                    onClick={() => onNavigate(pathSegment)}
                >
                    {part}
                </MuiLink>
            );
        }),
    ];


    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                <CircularProgress />
                <Typography sx={{ ml: 2 }}>Loading files...</Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ py: 4, textAlign: 'center', color: 'error.main' }}>
                <Typography>Error loading files: {error}</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ py: 4, px: 2 }}>
            <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
                {breadcrumbs}
            </Breadcrumbs>

            {currentPath && (
                <Button startIcon={<ArrowBackIcon />} onClick={onGoBack} sx={{ mb: 2 }}>
                    Go Back
                </Button>
            )}

            <Typography variant="h5" component="h2" gutterBottom>Contents of /{currentPath || 'Home'}</Typography>
            {filesAndFolders.length === 0 ? (
                <Typography sx={{ mt: 2 }}>No files or folders here. Upload some or create a new folder!</Typography>
            ) : (
                <List>
                    {filesAndFolders.map((item) => (
                        <ListItem
                            key={item.path} 
                            sx={{ borderBottom: '1px solid #eee' }}
                            // Fix for 'button' prop warning: Directly pass the boolean
                            button={item.type === 'folder'} 
                            onClick={item.type === 'folder' ? () => onNavigate(item.path) : undefined}
                            secondaryAction={
                                <IconButton edge="end" aria-label="delete" onClick={(e) => {
                                    e.stopPropagation(); 
                                    onDeleteItem(item.path, item.name);
                                }}>
                                    <DeleteIcon />
                                </IconButton>
                            }
                        >
                            <ListItemIcon>
                                {item.type === 'folder' ? <FolderIcon /> : <InsertDriveFileIcon />}
                            </ListItemIcon>
                            <ListItemText
                                primary={item.name}
                                secondary={item.type === 'file' ?
                                    `Size: ${(item.size / 1024).toFixed(2)} KB | Uploaded: ${new Date(item.createdAt).toLocaleString()}` :
                                    `Created: ${new Date(item.createdAt).toLocaleString()}`
                                }
                            />
                           
                        </ListItem>
                    ))}
                </List>
            )}
        </Box>
    );
}

AllFilesContent.propTypes = {
    filesAndFolders: PropTypes.array.isRequired,
    isLoading: PropTypes.bool.isRequired,
    error: PropTypes.string,
    currentPath: PropTypes.string.isRequired,
    onNavigate: PropTypes.func.isRequired,
    onGoBack: PropTypes.func.isRequired,
    onDeleteItem: PropTypes.func.isRequired, 
};

function DemoPageContent({ pathname, filesAndFolders, isLoading, error, currentPath, onNavigate, onGoBack , onDeleteItem}) {
    if (pathname === 'allfiles') {
        return (
            <AllFilesContent
                filesAndFolders={filesAndFolders}
                isLoading={isLoading}
                error={error}
                currentPath={currentPath}
                onNavigate={onNavigate}
                onGoBack={onGoBack}
                onDeleteItem={onDeleteItem} 
            />
        );
    }

 
    return (
        <Box
            sx={{
                py: 4,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
            }}
        >
            <Typography variant="h5" component="h2" gutterBottom>
                {pathname.charAt(0).toUpperCase() + pathname.slice(1)}
            </Typography>
            {isLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100px' }}>
                    <CircularProgress />
                    <Typography sx={{ ml: 2 }}>Loading...</Typography>
                </Box>
            ) : error ? (
                <Typography sx={{ mt: 2, color: 'error.main' }}>Error: {error}</Typography>
            ) : filesAndFolders.length === 0 ? (
                <Typography sx={{ mt: 2 }}>No items found in this section.</Typography>
            ) : (
                <List sx={{ width: '100%', maxWidth: 600 }}>
                    {filesAndFolders.map((item) => (
                        <ListItem key={item.path} sx={{ borderBottom: '1px solid #eee' }}>
                            <ListItemIcon>
                                {item.type === 'folder' ? <FolderIcon /> : <InsertDriveFileIcon />}
                            </ListItemIcon>
                            <ListItemText
                                primary={item.name}
                                secondary={item.type === 'file' ?
                                    `Size: ${(item.size / 1024).toFixed(2)} KB | Modified: ${new Date(item.modifiedAt).toLocaleString()}` :
                                    `Created: ${new Date(item.createdAt).toLocaleString()}`
                                }
                            />
                        </ListItem>
                    ))}
                </List>
            )}
        </Box>
    );
}


DemoPageContent.propTypes = {
    pathname: PropTypes.string.isRequired,
    filesAndFolders: PropTypes.array.isRequired,
    isLoading: PropTypes.bool.isRequired,
    error: PropTypes.string,
    currentPath: PropTypes.string.isRequired,
    onNavigate: PropTypes.func.isRequired,
    onGoBack: PropTypes.func.isRequired,
    onDeleteItem: PropTypes.func, // onDeleteItem is optional for non-allfiles segments
};


function CreateNewFolderDialog({ open, onClose, onFolderCreated }) {
    const [folderName, setFolderName] = React.useState('');

    const handleCreate = () => {
        if (folderName.trim()) {
            onFolderCreated(folderName);
            setFolderName('');
            onClose();
        } else {
            alert('Folder name cannot be empty!');
        }
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogContent>
                <TextField
                    autoFocus
                    margin="dense"
                    id="folderName"
                    label="Folder Name"
                    type="text"
                    fullWidth
                    variant="standard"
                    value={folderName}
                    onChange={(e) => setFolderName(e.target.value)}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleCreate}>Create</Button>
            </DialogActions>
        </Dialog>
    );
}

CreateNewFolderDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onFolderCreated: PropTypes.func.isRequired,
};


function ToolbarActions({ refreshFilesAndFolders, currentPath, disableActions }) { 
    const fileInputRef = React.useRef(null);
    const [openNewFolderDialog, setOpenNewFolderDialog] = React.useState(false);

    const handleUploadClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = async (event) => {
        const files = event.target.files;
        if (files.length > 0) {
            const formData = new FormData();
            for (let i = 0; i < files.length; i++) {
                formData.append('files', files[i]);
            }

            console.log('Frontend: currentPath being sent:', currentPath); 
          
            formData.append('currentPath', currentPath);

            try {
                const response = await fetch('http://localhost:5000/api/upload', {
                    method: 'POST',
                    body: formData,
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'File upload failed.');
                }

                const data = await response.json();
                console.log('Upload successful:', data);
                alert('Files uploaded successfully!');
                
                if (typeof refreshFilesAndFolders === 'function') {
                    refreshFilesAndFolders();
                }
            } catch (error) {
                console.error('Upload error:', error);
                alert(`Upload failed: ${error.message}`);
            }
        }
        event.target.value = null;
    };

    const handleNewFolderClick = () => {
        setOpenNewFolderDialog(true);
    };

    const handleCloseNewFolderDialog = () => {
        setOpenNewFolderDialog(false);
    };

    const handleFolderCreated = async (folderName) => {
        try {
            const response = await fetch('http://localhost:5000/api/create-folder', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name: folderName, currentPath: currentPath }), 
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create folder.');
            }

            const data = await response.json();
            console.log('Folder created successfully:', data);
            alert(`Folder "${folderName}" created successfully!`);
            
            if (typeof refreshFilesAndFolders === 'function') {
                refreshFilesAndFolders();
            }
        } catch (error) {
            console.error('Error creating folder:', error);
            alert(`Failed to create folder: ${error.message}`);
        }
    };

    return (
        <Stack direction={'row'} spacing={1} sx={{ mr: 2 }}>
            <Input
                type="file"
                inputRef={fileInputRef}
                onChange={handleFileChange}
                style={{ display: 'none' }}
                multiple
                disabled={disableActions} 
            />
            <Button variant='contained' onClick={handleUploadClick} disabled={disableActions}>
                Upload
            </Button>
            <Button onClick={handleNewFolderClick} disabled={disableActions}>
                New Folder
            </Button>

            <CreateNewFolderDialog
                open={openNewFolderDialog}
                onClose={handleCloseNewFolderDialog}
                onFolderCreated={handleFolderCreated}
            />
        </Stack>
    );
}

ToolbarActions.propTypes = {
    refreshFilesAndFolders: PropTypes.func,
    currentPath: PropTypes.string.isRequired, 
    disableActions: PropTypes.bool, 
};


function DashboardLayoutBranding(props) {
    const { window } = props;
    const router = useDemoRouter('/dashboard/allfiles');
    const demoWindow = window !== undefined ? window() : undefined;

    const [filesAndFolders, setFilesAndFolders] = React.useState([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState(null);
    const [currentPath, setCurrentPath] = React.useState(''); 
    
    const currentSegment = router.pathname.split('/').pop() || ''; 

    
    const fetchAllFilesAndFolders = React.useCallback(async (path = '') => {
        setIsLoading(true);
        setError(null);
        try {
            const url = path ? `http://localhost:5000/api/files-and-folders?currentPath=${encodeURIComponent(path)}` : 'http://localhost:5000/api/files-and-folders';
            const response = await fetch(url);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }
            const data = await response.json();
            setFilesAndFolders(data);
        } catch (err) {
            console.error("Failed to fetch all files and folders:", err);
            setError(err.message || 'An unknown error occurred while fetching data.');
        } finally {
            setIsLoading(false);
        }
    }, []);

   
    const fetchRecentFiles = React.useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('http://localhost:5000/api/recent-files'); 
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }
            const data = await response.json();
            setFilesAndFolders(data); 
        } catch (err) {
            console.error("Failed to fetch recent files:", err);
            setError(err.message || 'An unknown error occurred while fetching recent data.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    
    const fetchSharedFiles = React.useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('http://localhost:5000/api/shared-files'); 
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }
            const data = await response.json();
            setFilesAndFolders(data); 
        } catch (err) {
            console.error("Failed to fetch shared files:", err);
            setError(err.message || 'An unknown error occurred while fetching shared data.');
        } finally {
            setIsLoading(false);
        }
    }, []);

   
    const fetchTrashFiles = React.useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('http://localhost:5000/api/trash-files'); 
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }
            const data = await response.json();
            setFilesAndFolders(data); 
        } catch (err) {
            console.error("Failed to fetch trash files:", err);
            setError(err.message || 'An unknown error occurred while fetching trash data.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    const handleDeleteItem = React.useCallback(async (itemPath, itemName) => {
        // --- CRITICAL FIX FOR CONFIRM/ALERT (Ensures window.confirm/alert are called safely) ---
        let confirmed = true; 
        if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
            confirmed = window.confirm(`Are you sure you want to move "${itemName}" to Trash?`);
        } else {
            console.warn('Warning: window.confirm is not available. Skipping user confirmation.');
            // In a production app, you might want to prevent deletion or use a custom dialog here.
            // For now, it proceeds without user confirmation if window.confirm is missing.
        }

        if (!confirmed) {
            return; // User cancelled or confirmation wasn't available
        }
        // --- END CRITICAL FIX ---

        try {
            const response = await fetch('http://localhost:5000/api/move-to-trash', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ path: itemPath }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to move item to trash.');
            }

            console.log(`"${itemName}" moved to Trash successfully.`);
            // Safely use window.alert as well
            if (typeof window !== 'undefined' && typeof window.alert === 'function') {
                window.alert(`"${itemName}" moved to Trash successfully.`);
            } else {
                console.log(`(Alert: "${itemName}" moved to Trash successfully.)`);
            }
            
            fetchAllFilesAndFolders(currentPath); 
        } catch (error) {
            console.error('Error moving item to trash:', error);
            if (typeof window !== 'undefined' && typeof window.alert === 'function') {
                window.alert(`Failed to move "${itemName}" to trash: ${error.message}`);
            } else {
                console.error(`(Alert: Failed to move "${itemName}" to trash: ${error.message})`);
            }
        }
    }, [currentPath, fetchAllFilesAndFolders]); // Removed demoWindow from dependencies as we use direct window access

    React.useEffect(() => {
        console.log('DashboardLayoutBranding useEffect: currentSegment =', currentSegment);

        
        if (currentSegment === 'allfiles') {
            fetchAllFilesAndFolders(currentPath);
        } else if (currentSegment === 'recent') {
            fetchRecentFiles();
            setCurrentPath(''); 
        } else if (currentSegment === 'shared') {
            fetchSharedFiles();
            setCurrentPath(''); 
        } else if (currentSegment === 'trash') {
            fetchTrashFiles();
            setCurrentPath(''); 
        } else {
            
            setFilesAndFolders([]);
            setIsLoading(false);
            setError(null);
        }
    }, [fetchAllFilesAndFolders, fetchRecentFiles, fetchSharedFiles, fetchTrashFiles, currentPath, currentSegment]); 
   

    const handleNavigateToFolder = (path) => {
       
        if (currentSegment === 'allfiles') {
            setCurrentPath(path);
        }
    };

    const handleGoBack = () => {
        if (currentSegment === 'allfiles') {
            const pathParts = currentPath.split('/').filter(Boolean);
            if (pathParts.length > 0) {
                pathParts.pop(); 
                const newPath = pathParts.join('/');
                setCurrentPath(newPath);
            } else {
                setCurrentPath(''); 
            }
        }
    };

    const isAllFilesSegment = currentSegment === 'allfiles';

    return (
        <DemoProvider window={demoWindow}>
            <AppProvider
                navigation={NAVIGATION}
                branding={{
                    logo: <img src="https://mui.com/static/logo.png" alt="MUI logo" />,
                    title: 'MUI',
                    homeUrl: '/toolpad/core/introduction',
                }}
                router={router}
                theme={demoTheme}
                window={demoWindow}
            >
                <DashboardLayout
                    slots={{
                        toolbarAccount: () => (
                            <ToolbarActions
                                refreshFilesAndFolders={isAllFilesSegment ? () => fetchAllFilesAndFolders(currentPath) : undefined} 
                                currentPath={currentPath} 
                                disableActions={!isAllFilesSegment} 
                            />
                        ),
                    }}
                >
                    <DemoPageContent
                        pathname={currentSegment} 
                        filesAndFolders={filesAndFolders}
                        isLoading={isLoading}
                        error={error}
                        currentPath={currentPath} 
                        onNavigate={handleNavigateToFolder} 
                        onGoBack={handleGoBack} 
                        onDeleteItem={isAllFilesSegment ? handleDeleteItem : undefined} 
                    />
                </DashboardLayout>
            </AppProvider>
        </DemoProvider>
    );
}

DashboardLayoutBranding.propTypes = {
    window: PropTypes.func,
};

export default DashboardLayoutBranding;