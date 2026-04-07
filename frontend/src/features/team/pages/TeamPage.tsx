/**
 * Team Page - View members + Manage team groups
 */

import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout';
import { Card, Avatar, Badge, Button, Modal } from '@/components/ui';
import { teamApi, TeamGroup } from '@/services/team';
import { employeeApi } from '@/services/employees';
import { useAuth } from '@/app/providers/AuthProvider';
import { User } from '@/types';

const TEAM_COLORS = [
  { value: 'blue', class: 'bg-blue-500' },
  { value: 'green', class: 'bg-green-500' },
  { value: 'red', class: 'bg-red-500' },
  { value: 'purple', class: 'bg-purple-500' },
  { value: 'yellow', class: 'bg-yellow-500' },
  { value: 'pink', class: 'bg-pink-500' },
  { value: 'orange', class: 'bg-orange-500' },
  { value: 'cyan', class: 'bg-cyan-500' },
];

export const TeamPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [members, setMembers] = useState<User[]>([]);
  const [teamGroups, setTeamGroups] = useState<TeamGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [onlineCount, setOnlineCount] = useState(0);
  const [expandedTeams, setExpandedTeams] = useState<Set<number>>(new Set());

  // Create team modal
  const [showCreate, setShowCreate] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [newTeam, setNewTeam] = useState({ name: '', description: '', color: 'blue', member_ids: [] as number[] });
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [teamRes, groups] = await Promise.all([
        teamApi.getTeam(search, roleFilter),
        teamApi.getTeamGroups(),
      ]);
      setMembers(teamRes.data);
      setOnlineCount(teamRes.online_count);
      setTeamGroups(groups);
    } catch (err) {
      console.error('Failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [roleFilter]);
  useEffect(() => {
    const t = setTimeout(fetchData, 300);
    return () => clearTimeout(t);
  }, [search]);

  const toggleTeam = (id: number) => {
    setExpandedTeams(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleCreateTeam = async () => {
    if (!newTeam.name.trim()) return;
    try {
      setSaving(true);
      await teamApi.createTeamGroup(newTeam);
      setShowCreate(false);
      setNewTeam({ name: '', description: '', color: 'blue', member_ids: [] });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create team');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTeam = async (id: number, name: string) => {
    if (!window.confirm(`Delete team "${name}"?`)) return;
    try {
      await teamApi.deleteTeamGroup(id);
      fetchData();
    } catch (err) {
      alert('Failed to delete team');
    }
  };

  const openCreateModal = async () => {
    try {
      const users = await employeeApi.getEmployees();
      setAllUsers(users);
    } catch (err) { console.error(err); }
    setShowCreate(true);
  };

  const formatLastActive = (dateStr?: string) => {
    if (!dateStr) return 'Never';
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const colorClass = (c: string) => TEAM_COLORS.find(t => t.value === c)?.class || 'bg-blue-500';

  return (
    <AppLayout>
      <div className="p-6 min-h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Team</h1>
            <p style={{ color: 'var(--text-secondary)' }} className="mt-1">
              {members.length} members &middot; <span className="text-green-500 font-medium">{onlineCount} online</span>
            </p>
          </div>
          {isAdmin && (
            <Button onClick={openCreateModal}>+ New Team</Button>
          )}
        </div>

        {/* Team Groups */}
        {teamGroups.length > 0 && (
          <div className="mb-6 space-y-3">
            {teamGroups.map(team => (
              <Card key={team.id} className="border shadow-sm overflow-hidden" style={{ borderColor: 'var(--border-color)' }}>
                <div
                  className="flex items-center justify-between cursor-pointer px-5 py-4"
                  onClick={() => toggleTeam(team.id)}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-3 h-3 rounded-full ${colorClass(team.color)}`}></span>
                    <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{team.name}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ color: 'var(--text-muted)', backgroundColor: 'var(--border-color)' }}>
                      {team.member_count}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Member avatars preview */}
                    <div className="flex -space-x-2">
                      {team.members.slice(0, 5).map(m => (
                        <div key={m.id} className="w-7 h-7 rounded-full bg-primary-100 text-primary-600 text-xs font-bold flex items-center justify-center border-2" style={{ borderColor: 'var(--bg-card)' }} title={m.full_name}>
                          {m.full_name.charAt(0)}
                        </div>
                      ))}
                      {team.member_count > 5 && (
                        <div className="w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center border-2" style={{ borderColor: 'var(--bg-card)', backgroundColor: 'var(--border-color)', color: 'var(--text-muted)' }}>
                          +{team.member_count - 5}
                        </div>
                      )}
                    </div>
                    {isAdmin && (
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteTeam(team.id, team.name); }} className="p-1 text-gray-400 hover:text-red-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    )}
                    <svg className={`w-5 h-5 transition-transform ${expandedTeams.has(team.id) ? 'rotate-180' : ''}`} style={{ color: 'var(--text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                {expandedTeams.has(team.id) && (
                  <div className="px-5 pb-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pt-4">
                      {team.members.map(m => (
                        <div key={m.id} className="flex items-center gap-2 p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-page)' }}>
                          <div className="relative">
                            <Avatar name={m.full_name} size="sm" src={m.profile_pic_url || undefined} />
                            <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 ${m.is_online ? 'bg-green-500' : 'bg-gray-400'}`} style={{ borderColor: 'var(--bg-page)' }}></span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{m.full_name}</p>
                            <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>@{m.username}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Filters */}
        <Card className="border shadow-sm mb-6" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Search team members..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}
              />
            </div>
            <div className="flex gap-2">
              {['', 'admin', 'employee'].map(r => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    roleFilter === r ? 'bg-primary-500 text-white' : ''
                  }`}
                  style={roleFilter !== r ? { backgroundColor: 'var(--border-color)', color: 'var(--text-secondary)' } : undefined}
                >
                  {r === '' ? 'All' : r === 'admin' ? 'Admins' : 'Employees'}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* All Members Grid */}
        {loading ? (
          <Card className="border-0 shadow-sm text-center py-12">
            <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p style={{ color: 'var(--text-muted)' }}>Loading team...</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {members.map(member => (
              <Card key={member.id} className="border shadow-sm hover:shadow-md transition-shadow" style={{ borderColor: 'var(--border-color)' }}>
                <div className="text-center">
                  <div className="relative inline-block mb-3">
                    <Avatar name={member.full_name} size="xl" src={member.profile_pic_url || undefined} showStatus status={member.is_online ? 'online' : 'offline'} />
                  </div>
                  <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{member.full_name}</h3>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>@{member.username}</p>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <Badge variant={member.role === 'admin' ? 'primary' : 'secondary'} size="sm">
                      {member.role === 'admin' ? 'Admin' : 'Employee'}
                    </Badge>
                    <span className={`inline-flex items-center gap-1 text-xs font-medium ${member.is_online ? 'text-green-500' : ''}`} style={!member.is_online ? { color: 'var(--text-muted)' } : undefined}>
                      <span className={`w-2 h-2 rounded-full ${member.is_online ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                      {member.is_online ? 'Online' : formatLastActive(member.last_active)}
                    </span>
                  </div>
                  <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>{member.email}</p>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Create Team Modal */}
        {showCreate && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" onClick={() => setShowCreate(false)}>
            <div className="rounded-xl shadow-2xl w-full max-w-lg p-6" style={{ backgroundColor: 'var(--bg-card)' }} onClick={e => e.stopPropagation()}>
              <h2 className="text-xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Create Team</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Team Name *</label>
                  <input
                    type="text"
                    value={newTeam.name}
                    onChange={e => setNewTeam(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Marketing"
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-page)', color: 'var(--text-primary)' }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Description</label>
                  <input
                    type="text"
                    value={newTeam.description}
                    onChange={e => setNewTeam(p => ({ ...p, description: e.target.value }))}
                    placeholder="Optional description"
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-page)', color: 'var(--text-primary)' }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Color</label>
                  <div className="flex gap-2">
                    {TEAM_COLORS.map(c => (
                      <button
                        key={c.value}
                        onClick={() => setNewTeam(p => ({ ...p, color: c.value }))}
                        className={`w-7 h-7 rounded-full ${c.class} ${newTeam.color === c.value ? 'ring-2 ring-offset-2 ring-primary-500' : ''}`}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Members</label>
                  <div className="max-h-48 overflow-y-auto space-y-1 border rounded-lg p-2" style={{ borderColor: 'var(--border-color)' }}>
                    {allUsers.map(u => (
                      <label key={u.id} className="flex items-center gap-2 p-2 rounded hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newTeam.member_ids.includes(u.id)}
                          onChange={e => {
                            if (e.target.checked) {
                              setNewTeam(p => ({ ...p, member_ids: [...p.member_ids, u.id] }));
                            } else {
                              setNewTeam(p => ({ ...p, member_ids: p.member_ids.filter(id => id !== u.id) }));
                            }
                          }}
                          className="w-4 h-4 text-primary-500 rounded"
                        />
                        <Avatar name={u.full_name} size="xs" />
                        <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{u.full_name}</span>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>@{u.username}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm font-medium rounded-lg transition-colors" style={{ color: 'var(--text-secondary)' }}>Cancel</button>
                <Button onClick={handleCreateTeam} isLoading={saving}>Create Team</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default TeamPage;
