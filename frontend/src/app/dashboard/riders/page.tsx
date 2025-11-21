'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { api, Rider } from '@/lib/api';
import { toast } from 'sonner';

export default function RidersPage() {
  const [riders, setRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchRiders = async () => {
    try {
      const result = await api.getRiders();
      if (result.success) {
        setRiders(result.data);
      }
    } catch {
      toast.error('Failed to fetch riders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiders();
  }, []);

  const handleAddRider = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const result = await api.createRider(name, mobile);
      if (result.success) {
        toast.success('Rider added successfully');
        setDialogOpen(false);
        setName('');
        setMobile('');
        fetchRiders();
      } else {
        toast.error(result.message || 'Failed to add rider');
      }
    } catch {
      toast.error('Failed to add rider');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRider = async (id: number) => {
    if (!confirm('Are you sure you want to deactivate this rider?')) return;

    try {
      const result = await api.deleteRider(id);
      if (result.success) {
        toast.success('Rider deactivated');
        fetchRiders();
      } else {
        toast.error(result.message || 'Failed to deactivate rider');
      }
    } catch {
      toast.error('Failed to deactivate rider');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Riders</h1>
          <Button onClick={() => setDialogOpen(true)}>Add Rider</Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Riders</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center py-4">Loading riders...</p>
            ) : riders.length === 0 ? (
              <p className="text-center py-4 text-gray-500">No riders found</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Mobile</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Added On</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {riders.map((rider) => (
                    <TableRow key={rider.id}>
                      <TableCell>{rider.id}</TableCell>
                      <TableCell className="font-medium">{rider.name}</TableCell>
                      <TableCell>{rider.mobile}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            rider.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }
                        >
                          {rider.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(rider.created_at)}
                      </TableCell>
                      <TableCell>
                        {rider.status === 'active' && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteRider(rider.id)}
                          >
                            Deactivate
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Add Rider Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Rider</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddRider} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Enter rider name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobile">Mobile Number</Label>
                <Input
                  id="mobile"
                  placeholder="Enter mobile number"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  required
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Adding...' : 'Add Rider'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
