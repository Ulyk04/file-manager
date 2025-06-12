import * as React from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { createTheme } from '@mui/material/styles';
import FolderIcon from '@mui/icons-material/Folder';
import ScheduleIcon from '@mui/icons-material/Schedule';
import ShareIcon from '@mui/icons-material/Share';
import DeleteIcon from '@mui/icons-material/Delete';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile'; // For file icon
import { AppProvider } from '@toolpad/core/AppProvider';
import { DashboardLayout } from '@toolpad/core/DashboardLayout';
import { DemoProvider, useDemoRouter } from '@toolpad/core/internal';
import { Button, Stack, Input, TextField, Dialog, DialogTitle, DialogContent, DialogActions, List, ListItem, ListItemText, ListItemIcon, CircularProgress } from '@mui/material';


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
          primary: {
            main: '#000000',
          },
          secondary: {
            main: '#ffffff',
          },
          background: {
            default: '#ffffff',
            paper: '#ffffff',
          },
          text: {
            primary: 'black',
            secondary: 'black',
          },

          custom: {
              mainBackground: '#ffffff',
          }
        },
      },
      dark: {
        palette: {
          primary: {
            main: '#ffffff',
          },
          secondary: {
            main: '#000000',
          },
          background: {
            default: '#00000',
            paper: '#000000',
          },
          text: {
            primary: '#ffffff',
            secondary: '#00000',
          },
           custom: {
              mainBackground: '#343a40',
          }
        },
      },
    },
    breakpoints: {
      values: {
        xs: 0,
        sm: 600,
        md: 600,
        lg: 1200,
        xl: 1536,
      },
    },
  });

  function AllFilesContent({ filesAndFolders, isLoading, error }) {
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

    if (filesAndFolders.length === 0) {
        return (
            <Box sx={{ py: 4, textAlign: 'center' }}>
                <Typography>No files or folders yet. Upload some or create a new folder!</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ py: 4, px: 2 }}>
            <Typography variant="h5" component="h2" gutterBottom>All Files</Typography>
            <List>
                {filesAndFolders.map((item) => (
                    <ListItem key={item.name} sx={{ borderBottom: '1px solid #eee' }}>
                        <ListItemIcon>
                            {item.type === 'folder' ? <FolderIcon /> : <InsertDriveFileIcon />}
                        </ListItemIcon>
                        <ListItemText
                            primary={item.name}
                            secondary={item.type === 'file' ? `Size: ${(item.size / 1024).toFixed(2)} KB | Uploaded: ${new Date(item.createdAt).toLocaleString()}` : `Created: ${new Date(item.createdAt).toLocaleString()}`}
                        />
                        
                    </ListItem>
                ))}
            </List>
        </Box>
    );
}

AllFilesContent.propTypes = {
    filesAndFolders: PropTypes.array.isRequired,
    isLoading: PropTypes.bool.isRequired,
    error: PropTypes.string,
};


function DemoPageContent({ pathname, filesAndFolders, isLoading, error }) {
  if (pathname === 'allfiles') {
    return <AllFilesContent filesAndFolders={filesAndFolders} isLoading={isLoading} error={error} />;
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
      <Typography>Dashboard content for {pathname}</Typography>
      
    </Box>
  );
}

DemoPageContent.propTypes = {
  pathname: PropTypes.string.isRequired,
  filesAndFolders: PropTypes.array.isRequired, 
  isLoading: PropTypes.bool.isRequired,
  error: PropTypes.string,
};
function CreateNewFolderDialog({ open, onClose, onFolderCreated }) {
    const [folderName, setFolderName] = React.useState('');

    const handleCreate = () => {
        if (folderName.trim()) {
            console.log("Creating new folder:", folderName);
           
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


function ToolbarActions({refreshFiles}) {
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
              refreshFiles();
          } catch (error) {
              console.error('Upload error:', error);
              alert(`Upload failed: ${error.message}`);
          }
      }
      event.target.value = null; 
    }

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
              body: JSON.stringify({ name: folderName }),
          });

          if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.message || 'Failed to create folder.');
          }

          const data = await response.json();
          console.log('Folder created successfully:', data);
          alert(`Folder "${folderName}" created successfully!`); 
          refreshFiles();
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
            />
            <Button variant='contained' onClick={handleUploadClick}>
                Upload
            </Button>
            <Button onClick={handleNewFolderClick}>
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
  refreshFilesAndFolders: PropTypes.func.isRequired,
};

function DashboardLayoutBranding(props) {
  const { window } = props;
  const router = useDemoRouter('/dashboard/allfiles');
  const demoWindow = window !== undefined ? window() : undefined;

  const [filesAndFolders, setFilesAndFolders] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  const fetchFilesAndFolders = React.useCallback(async () => {
      setIsLoading(true);
      setError(null);
      try {
          const response = await fetch('http://localhost:5000/api/files-and-folders');
          if (!response.ok) {
              const errorText = await response.text(); 
              throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
          }
          const data = await response.json();
          setFilesAndFolders(data);
      } catch (err) {
          console.error("Failed to fetch files and folders:", err);
          setError(err.message || 'An unknown error occurred while fetching data.');
      } finally {
          setIsLoading(false);
      }
  }, []); 

  React.useEffect(() => {
      fetchFilesAndFolders();
  }, [fetchFilesAndFolders]); 


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
            toolbarAccount: () => <ToolbarActions refreshFilesAndFolders={fetchFilesAndFolders} />,
          }}
        >
          <DemoPageContent
            pathname={router.pathname.replace('/dashboard/', '')} 
            filesAndFolders={filesAndFolders}
            isLoading={isLoading}
            error={error}
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