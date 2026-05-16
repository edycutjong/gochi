import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { WalletConnect } from './WalletConnect';
import { useAccount, useConnect, useDisconnect, useChainId } from 'wagmi';

describe('WalletConnect', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useChainId as jest.Mock).mockReturnValue(16602);
  });

  it('renders connect button when not connected', async () => {
    (useAccount as jest.Mock).mockReturnValue({
      address: undefined,
      isConnected: false,
    });
    
    const mockConnect = jest.fn();
    (useConnect as jest.Mock).mockReturnValue({
      connect: mockConnect,
      connectors: [{ id: 'metaMask', name: 'MetaMask' }],
      error: null,
    });

    await act(async () => {
      render(<WalletConnect />);
    });

    const connectButton = screen.getByText('Connect Wallet');
    expect(connectButton).toBeInTheDocument();

    fireEvent.click(connectButton);
    fireEvent.click(screen.getByText('MetaMask'));
    expect(mockConnect).toHaveBeenCalledWith({ connector: { id: 'metaMask', name: 'MetaMask' } });
  });

  it('deduplicates injected connector if metaMask is present', async () => {
    (useAccount as jest.Mock).mockReturnValue({
      address: undefined,
      isConnected: false,
    });
    
    (useConnect as jest.Mock).mockReturnValue({
      connect: jest.fn(),
      connectors: [
        { id: 'metaMask', name: 'MetaMask' },
        { id: 'injected', name: 'Injected' },
        { id: 'walletConnect', name: 'WalletConnect' }
      ],
      error: null,
    });

    await act(async () => {
      render(<WalletConnect />);
    });

    fireEvent.click(screen.getByText('Connect Wallet'));
    expect(screen.getByText('MetaMask')).toBeInTheDocument();
    expect(screen.getByText('WalletConnect')).toBeInTheDocument();
    expect(screen.queryByText('Injected')).not.toBeInTheDocument();
  });

  it('renders disconnect button when connected', async () => {
    (useAccount as jest.Mock).mockReturnValue({
      address: '0x1234567890abcdef1234567890abcdef12345678',
      isConnected: true,
    });
    
    const mockDisconnect = jest.fn();
    (useDisconnect as jest.Mock).mockReturnValue({
      disconnect: mockDisconnect,
    });

    await act(async () => {
      render(<WalletConnect />);
    });

    expect(screen.getByText('0x1234…5678')).toBeInTheDocument();
    
    const disconnectButton = screen.getByRole('button', { name: 'Disconnect' });
    expect(disconnectButton).toBeInTheDocument();

    fireEvent.click(disconnectButton);
    expect(mockDisconnect).toHaveBeenCalled();
  });

  it('renders wrong network when connected to wrong chain', async () => {
    (useAccount as jest.Mock).mockReturnValue({
      address: '0x1234567890abcdef1234567890abcdef12345678',
      isConnected: true,
    });
    (useChainId as jest.Mock).mockReturnValue(1); // Not 16602
    
    await act(async () => {
      render(<WalletConnect />);
    });

    expect(screen.getByText('Wrong network')).toBeInTheDocument();
  });

  it('displays error message when connection fails', async () => {
    (useAccount as jest.Mock).mockReturnValue({
      address: undefined,
      isConnected: false,
    });
    
    (useConnect as jest.Mock).mockReturnValue({
      connect: jest.fn(),
      connectors: [{ id: 'metaMask', name: 'MetaMask' }],
      error: { message: 'Connection rejected' },
    });

    await act(async () => {
      render(<WalletConnect />);
    });

    expect(screen.getByText('Connection rejected')).toBeInTheDocument();
  });

  it('uses first connector if no preferred connector found', async () => {
    (useAccount as jest.Mock).mockReturnValue({
      address: undefined,
      isConnected: false,
    });
    
    const mockConnect = jest.fn();
    (useConnect as jest.Mock).mockReturnValue({
      connect: mockConnect,
      connectors: [{ id: 'someWallet', name: 'Some Wallet' }],
      error: null,
    });

    await act(async () => {
      render(<WalletConnect />);
    });

    const connectButton = screen.getByText('Connect Wallet');
    fireEvent.click(connectButton);
    fireEvent.click(screen.getByText('Some Wallet'));
    expect(mockConnect).toHaveBeenCalledWith({ connector: { id: 'someWallet', name: 'Some Wallet' } });
  });
  it('displays user-friendly message when wallet request is already pending', async () => {
    (useAccount as jest.Mock).mockReturnValue({
      address: undefined,
      isConnected: false,
    });
    
    (useConnect as jest.Mock).mockReturnValue({
      connect: jest.fn(),
      connectors: [{ id: 'metaMask', name: 'MetaMask' }],
      error: { message: "Request of type 'wallet_requestPermissions' already pending for origin http://localhost:3000. Please wait." },
    });

    await act(async () => {
      render(<WalletConnect />);
    });

    expect(screen.getByText('Open your wallet extension')).toBeInTheDocument();
  });

  it('closes dropdown when clicking outside', async () => {
    (useAccount as jest.Mock).mockReturnValue({
      address: undefined,
      isConnected: false,
    });
    
    (useConnect as jest.Mock).mockReturnValue({
      connect: jest.fn(),
      connectors: [{ id: 'metaMask', name: 'MetaMask' }],
      error: null,
    });

    await act(async () => {
      render(
        <div>
          <div data-testid="outside">Outside</div>
          <WalletConnect />
        </div>
      );
    });

    const connectButton = screen.getByText('Connect Wallet');
    
    await act(async () => {
      fireEvent.click(connectButton);
    });
    expect(screen.getByText('MetaMask')).toBeInTheDocument();

    await act(async () => {
      fireEvent.mouseDown(screen.getByTestId('outside'));
    });
    expect(screen.queryByText('MetaMask')).not.toBeInTheDocument();
  });
});
