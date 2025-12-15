import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Shield, ShieldOff, Ban, UserCheck, Search } from 'lucide-react';

interface User {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  is_banned?: boolean;
  created_at: string;
}

interface UserRole {
  user_id: string;
  role: 'admin' | 'user';
}

interface AdminUsersProps {
  users: User[];
  userRoles: UserRole[];
  onRefresh: () => void;
}

const AdminUsers = ({ users, userRoles, onRefresh }: AdminUsersProps) => {
  const { toast } = useToast();
  const [search, setSearch] = useState('');

  const getUserRole = (userId: string) => {
    const role = userRoles.find(r => r.user_id === userId);
    return role?.role || 'user';
  };

  const toggleBan = async (userId: string, currentlyBanned: boolean) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_banned: !currentlyBanned })
      .eq('user_id', userId);
    
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: currentlyBanned ? 'User unbanned' : 'User banned' });
      onRefresh();
    }
  };

  const updateRole = async (userId: string, newRole: 'admin' | 'user') => {
    const existingRole = userRoles.find(r => r.user_id === userId);
    
    if (existingRole) {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userId);
      
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
        return;
      }
    } else {
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: newRole });
      
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
        return;
      }
    }
    
    toast({ title: `User role updated to ${newRole}` });
    onRefresh();
  };

  const filteredUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search users..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map(user => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.full_name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Select
                    value={getUserRole(user.user_id)}
                    onValueChange={(v: 'admin' | 'user') => updateRole(user.user_id, v)}
                  >
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  {user.is_banned ? (
                    <Badge variant="destructive" className="gap-1">
                      <Ban className="h-3 w-3" /> Banned
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1 bg-primary/10 text-primary">
                      <UserCheck className="h-3 w-3" /> Active
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    variant={user.is_banned ? 'outline' : 'destructive'}
                    size="sm"
                    onClick={() => toggleBan(user.user_id, !!user.is_banned)}
                  >
                    {user.is_banned ? (
                      <>
                        <ShieldOff className="h-4 w-4 mr-1" /> Unban
                      </>
                    ) : (
                      <>
                        <Ban className="h-4 w-4 mr-1" /> Ban
                      </>
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminUsers;
