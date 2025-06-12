
import { TextField, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';



function CreateNewFolderPage({ onFolderCreated, onCancel }) {
    const [folderName, setFolderName] = React.useState('');

    const handleCreateFolder = () => {
        if (folderName.trim()) {
            console.log("Creating new folder:", folderName);
          
            onFolderCreated(folderName);
        } else {
            alert('Folder name cannot be empty!');
        }
    };

    return (
        <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography variant="h5" mb={3}>Create New Folder</Typography>
            <TextField
                label="Folder Name"
                variant="outlined"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                fullWidth
                sx={{ mb: 2, maxWidth: 400 }}
            />
            <Stack direction="row" spacing={2}>
                <Button variant="contained" onClick={handleCreateFolder}>
                    Create
                </Button>
                <Button variant="outlined" onClick={onCancel}>
                    Cancel
                </Button>
            </Stack>
        </Box>
    );
}

CreateNewFolderPage.propTypes = {
    onFolderCreated: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
};