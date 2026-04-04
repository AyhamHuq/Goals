import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Select,
  MenuItem,
  Button,
  Avatar,
  FormControl,
  InputLabel,
  CircularProgress,
} from '@mui/material';
import { useUserContext } from '../context/UserContext';
import { touchUser } from '../api/users';

export default function UserSelectScreen() {
  const navigate = useNavigate();
  const { users, usersLoading, selectedUser, setSelectedUser } = useUserContext();
  const [chosenId, setChosenId] = useState<string>('');

  useEffect(() => {
    if (selectedUser) {
      setChosenId(selectedUser.id);
    }
  }, [selectedUser]);

  const handleGo = async () => {
    const user = users.find((u) => u.id === chosenId);
    if (!user) return;
    setSelectedUser(user);
    try {
      await touchUser(user.id);
    } catch {
      // non-critical
    }
    navigate('/dashboard');
  };

  if (usersLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      sx={{ bgcolor: 'background.default', p: 2 }}
    >
      <Card sx={{ width: '100%', maxWidth: 400 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center" fontWeight={700}>
            Family Goals
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
            Who's checking in?
          </Typography>

          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel id="user-select-label">Select your name</InputLabel>
            <Select
              labelId="user-select-label"
              value={chosenId}
              label="Select your name"
              onChange={(e) => setChosenId(e.target.value)}
              renderValue={(val) => {
                const user = users.find((u) => u.id === val);
                if (!user) return '';
                return (
                  <Box display="flex" alignItems="center" gap={1}>
                    <Avatar
                      sx={{ width: 28, height: 28, bgcolor: user.avatar_color, fontSize: 13 }}
                    >
                      {user.display_name[0].toUpperCase()}
                    </Avatar>
                    {user.display_name}
                  </Box>
                );
              }}
            >
              {users.map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Avatar
                      sx={{ width: 32, height: 32, bgcolor: user.avatar_color, fontSize: 14 }}
                    >
                      {user.display_name[0].toUpperCase()}
                    </Avatar>
                    {user.display_name}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            variant="contained"
            fullWidth
            size="large"
            disabled={!chosenId}
            onClick={handleGo}
          >
            Let's Go
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}
