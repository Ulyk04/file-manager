import * as React from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { createTheme } from '@mui/material/styles';
import FolderIcon from '@mui/icons-material/Folder';
import ScheduleIcon from '@mui/icons-material/Schedule';
import ShareIcon from '@mui/icons-material/Share';
import DeleteIcon from '@mui/icons-material/Delete';
import { AppProvider } from '@toolpad/core/AppProvider';
import { DashboardLayout } from '@toolpad/core/DashboardLayout';
import { DemoProvider, useDemoRouter } from '@toolpad/core/internal';
import { Button, Input, Stack } from '@mui/material';

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

function DemoPageContent({ pathname }) {
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
};

function ToolbarActions(){

  const fileInputRef = React.useRef(null); 

    const handleUploadClick = () => {
        fileInputRef.current.click(); 
    };

    const handleFileChange = (event) => {
      const files = event.target.files;
      if (files.length > 0) {
          console.log("Selected files:", files);
      }
      event.target.value = null;
  };

  return(
    <Stack direction={'row'} spacing={1} sx={{mr: 2}} >
      <Input
        type="file"
        inputRef={fileInputRef}
        onChange={handleFileChange}
        sx={{ display: 'none' }}
        multiple
      />
        <div>
           <Button variant='contained' onClick={handleUploadClick} >
              Upload
           </Button>
           <Button>
              New Folder
           </Button>
        </div>
    </Stack>
  )
}

function DashboardLayoutBranding(props) {
  const { window } = props;

  const router = useDemoRouter('/dashboard');

  
  const demoWindow = window !== undefined ? window() : undefined;

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
            toolbarAccount: ToolbarActions,
          }}
        >
          <DemoPageContent pathname={router.pathname} />
        </DashboardLayout>
      </AppProvider>
    
    </DemoProvider>
  );
}

DashboardLayoutBranding.propTypes = {
  window: PropTypes.func,
};

export default DashboardLayoutBranding;