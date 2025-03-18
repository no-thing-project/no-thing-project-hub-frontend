import React, { useState } from 'react';
import { Drawer, List, ListItem, IconButton, ListItemText } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';

const Sidebar = ({ onLogout }) => {
  const [open, setOpen] = useState(true);

  const toggleSidebar = () => {
    setOpen(!open);
  };

  return (
    <div className="sidebar-container" style={{ display: 'flex' }}>
      <IconButton onClick={toggleSidebar} className="sidebar-toggle">
        <MenuIcon />
      </IconButton>
      <Drawer 
        variant="persistent" 
        anchor="left" 
        open={open} 
        PaperProps={{ style: { width: 240 } }}  // Встановлюємо ширину
        className="sidebar-drawer"
      >
        <List>
          <ListItem button onClick={onLogout}>
            <ExitToAppIcon style={{ marginRight: 8 }} />
            <ListItemText primary="Вихід" />
          </ListItem>
        </List>
      </Drawer>
    </div>
  );
};

export default Sidebar;
