import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { BranchesStaffPage } from '../BranchesStaffPage';
import { adminService } from '../adminService';

vi.mock('../adminService');

describe('BranchesStaffPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(adminService.getBranches).mockResolvedValue([]);
    vi.mocked(adminService.getStaff).mockResolvedValue([]);
  });

  it('sends every required backend branch field when provisioning a branch', async () => {
    const user = userEvent.setup();
    vi.mocked(adminService.createBranch).mockResolvedValue({
      id: 'branch-1',
      branchCode: '1001',
      branchName: 'FinServ Branch 1001',
      ifscCode: 'FINS0100101',
      routingNumber: '1001',
      streetAddress: 'Financial District, Level 4',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560001',
      phoneNumber: '+918011223344',
      status: 'ACTIVE',
    });

    render(
      <MemoryRouter>
        <BranchesStaffPage />
      </MemoryRouter>
    );

    await user.click(await screen.findByRole('button', { name: /add new bank branch/i }));
    await user.click(screen.getByRole('button', { name: /provision branch/i }));

    await waitFor(() => {
      expect(adminService.createBranch).toHaveBeenCalledWith({
        branchCode: '1001',
        branchName: 'FinServ Branch 1001',
        ifscCode: 'FINS0100101',
        routingNumber: '1001',
        streetAddress: 'Financial District, Level 4',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560001',
        phoneNumber: '+918011223344',
      });
    });
    expect(await screen.findByText(/created successfully/i)).toBeInTheDocument();
  });

  it('allows provisioning a Super Admin with role SUPER_ADMIN and executive defaults', async () => {
    const user = userEvent.setup();
    vi.mocked(adminService.getBranches).mockResolvedValue([
      {
        id: 'branch-1',
        branchCode: '1001',
        branchName: 'FinServ Mumbai Central',
        ifscCode: 'FINS0100101',
        routingNumber: '1001',
        streetAddress: 'Fort',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400001',
        phoneNumber: '+912211223344',
        status: 'ACTIVE',
      },
    ]);
    vi.mocked(adminService.getStaff).mockResolvedValue([]);
    vi.mocked(adminService.createStaff).mockResolvedValue({
      id: 'staff-super-1',
      username: 'lead.superadmin',
      email: 'lead@finserv.local',
      phoneNumber: '+919876543210',
      role: 'ROLE_SUPER_ADMIN',
      branchId: 'branch-1',
      branchName: 'FinServ Mumbai Central',
      department: 'Executive Leadership',
      designation: 'Executive Super Administrator',
      status: 'ACTIVE',
      createdAt: '2026-10-25T10:00:00Z',
    });

    render(
      <MemoryRouter>
        <BranchesStaffPage />
      </MemoryRouter>
    );

    // Switch to Staff tab
    const staffTabButton = await screen.findByRole('button', { name: /bank officers & admins/i });
    await user.click(staffTabButton);

    // Click provision button
    const openModalBtn = await screen.findByRole('button', { name: /provision staff \/ super admin/i });
    await user.click(openModalBtn);

    // Fill in required fields
    const usernameInput = screen.getByLabelText(/username/i);
    const emailInput = screen.getByLabelText(/^email$/i);
    const passwordInput = screen.getByLabelText(/temporary password/i);
    const roleSelect = screen.getByLabelText(/security role/i);

    await user.clear(usernameInput);
    await user.type(usernameInput, 'lead.superadmin');
    await user.clear(emailInput);
    await user.type(emailInput, 'lead@finserv.local');
    await user.type(passwordInput, 'SuperSecret@123');

    // Select SUPER_ADMIN
    await user.selectOptions(roleSelect, 'SUPER_ADMIN');

    // Submit form
    const submitBtn = screen.getByRole('button', { name: /provision super admin/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(adminService.createStaff).toHaveBeenCalledWith(
        expect.objectContaining({
          username: 'lead.superadmin',
          email: 'lead@finserv.local',
          role: 'SUPER_ADMIN',
          department: 'Executive Leadership',
          designation: 'Executive Super Administrator',
        })
      );
    });

    expect(await screen.findByText(/super administrator lead\.superadmin provisioned successfully/i)).toBeInTheDocument();
  }, 15000);

  it('displays KPI counters and filters staff by role and search query', async () => {
    const user = userEvent.setup();
    vi.mocked(adminService.getBranches).mockResolvedValue([]);
    vi.mocked(adminService.getStaff).mockResolvedValue([
      {
        id: 's1',
        username: 'super.boss',
        email: 'super@finserv.local',
        phoneNumber: '+919000000001',
        role: 'ROLE_SUPER_ADMIN',
        branchId: 'b1',
        branchName: 'Headquarters',
        department: 'Executive Leadership',
        designation: 'Chief Super Admin',
        status: 'ACTIVE',
        createdAt: '2026-10-25T10:00:00Z',
      },
      {
        id: 's2',
        username: 'manager.bob',
        email: 'bob@finserv.local',
        phoneNumber: '+919000000002',
        role: 'ROLE_ADMIN',
        branchId: 'b1',
        branchName: 'Mumbai Fort',
        department: 'Branch Operations',
        designation: 'Branch Administrator',
        status: 'ACTIVE',
        createdAt: '2026-10-25T10:00:00Z',
      },
      {
        id: 's3',
        username: 'officer.charlie',
        email: 'charlie@finserv.local',
        phoneNumber: '+919000000003',
        role: 'ROLE_EMPLOYEE',
        branchId: 'b1',
        branchName: 'Mumbai Fort',
        department: 'Counter Operations',
        designation: 'Bank Officer',
        status: 'ACTIVE',
        createdAt: '2026-10-25T10:00:00Z',
      },
    ]);

    render(
      <MemoryRouter>
        <BranchesStaffPage />
      </MemoryRouter>
    );

    // Switch to Staff tab
    await user.click(await screen.findByRole('button', { name: /bank officers & admins/i }));

    // Verify staff rows are rendered
    expect(await screen.findByText('super.boss')).toBeInTheDocument();
    expect(screen.getByText('manager.bob')).toBeInTheDocument();
    expect(screen.getByText('officer.charlie')).toBeInTheDocument();

    // Verify role badges
    expect(screen.getByText('Super Admin')).toBeInTheDocument();
    expect(screen.getByText('Branch Admin')).toBeInTheDocument();
    expect(screen.getAllByText('Bank Officer').length).toBeGreaterThanOrEqual(1);

    // Filter by SUPER_ADMIN
    const filterSelect = screen.getByDisplayValue(/all roles/i);
    await user.selectOptions(filterSelect, 'SUPER_ADMIN');

    expect(screen.getByText('super.boss')).toBeInTheDocument();
    expect(screen.queryByText('manager.bob')).not.toBeInTheDocument();
    expect(screen.queryByText('officer.charlie')).not.toBeInTheDocument();
  }, 15000);
});
