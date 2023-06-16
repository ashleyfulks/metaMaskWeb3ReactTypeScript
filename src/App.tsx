import './App.css'
import {useState, useEffect} from 'react'
import { formatBalance, formatChainAsNum } from './utils'
import detectEthereumProvider from '@metamask/detect-provider'

/// This is the mail app component
const App = () => {
  const [hasProvider, setHasProvider] = useState<boolean | null>(null)
  const initialState = { accounts: [], balance: "", chainId: "" }
  const [wallet, setWallet] = useState(initialState)

  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  // This is the main hook that runs on page load to control state
  useEffect(() => {
    const refreshAccounts = (accounts: any) => {
      if (accounts.length > 0) {
        updateWallet(accounts)
        } else {
          setWallet(initialState)
        }
    }

    // This is the hook that runs when the chain changes
    const refreshChain = (chainId: any) => {
      setWallet((wallet) => ({ ...wallet, chainId }))
    }

    // This is the hook that runs on page load to detect the provider
    const getProvider = async () => {
      const provider = await detectEthereumProvider({ silent: true})
      console.log(provider)
      setHasProvider(Boolean(provider)) //transform provider to true or false
      
      if(provider) {
        const accounts = await window.ethereum.request(
          { method: 'eth_accounts' }
        )
        refreshAccounts(accounts)
        window.ethereum.on('accountsChanged', refreshAccounts)
        window.ethereum.on('chainChanged', refreshChain)
      }
    }

    getProvider()
    return () => {
      window.ethereum?.removeListener('accountsChanged', refreshAccounts)
      window.ethereum?.removeListener('chainChanged', refreshChain)
    }
  }, [])

  // This is the hook that runs when the user clicks the connect button
  const updateWallet = async (accounts:any) => {
    const balance = formatBalance(await window.ethereum.request({
      method: 'eth_getBalance',
      params: [accounts[0], "latest"],
    }))
    const chainId = await window.ethereum!.request({
      method: "eth_chainId",
    })
    setWallet({accounts, balance, chainId })
  }

  const handleConnect = async () => {
    setIsConnecting(true)
    await window.ethereum.request({
      method: "eth_requestAccounts",
    })
    .then((accounts:[]) => {
      setError(false)
      updateWallet(accounts)
    })
    .catch((err:any) => {
      setError(true)
      setErrorMessage(err.message)
    })
    setIsConnecting(false)
  }

  // This is the main app component that renders the page
  return (
    <div className='App'>
      <h2>Injected Provider { hasProvider ? 'DOES' : 'DOES NOT'} Exist</h2>
    
      { window.ethereum?.isMetaMask && wallet.accounts.length < 1 && 
      <button onClick={handleConnect}>Connect MetaMask</button>
      }

      { wallet.accounts.length > 0 &&
        <>
        <div>Wallet Accounts: { wallet.accounts[0] }</div>
        <div>Wallet Balance: {wallet.balance}</div>
        <div>Wallet ChainId: {wallet.chainId}</div>
        <div>Numeric ChainId: {formatChainAsNum(wallet.chainId)}</div>
        <div>ParseInt ChainId: {parseInt(wallet.chainId)}</div>
        </>
      }
      { error && (
        <div onClick={() => setError(false)}>
          <strong>Error:</strong> {errorMessage}
          <div>isConnecting: {String(isConnecting)}</div>
        </div>
       )
      }
      </div>
    )
}

export default App