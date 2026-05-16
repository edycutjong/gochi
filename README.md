<div align="center">
  <h1>Gochi 🐾</h1>
  <p><em>On-chain AI virtual pet on 0G Network</em></p>
  <img src="docs/readme-hero.png" alt="Gochi" width="100%">

  <br/>

  [![Live Demo](https://img.shields.io/badge/🚀_Live-Demo-06b6d4?style=for-the-badge)](https://gochi.edycu.dev)
  [![Pitch Video](https://img.shields.io/badge/🎬_Pitch-Video-ef4444?style=for-the-badge)](https://youtu.be/your-video)
  [![Pitch Deck](https://img.shields.io/badge/📊_Pitch-Deck-f59e0b?style=for-the-badge)](https://gochi.edycu.dev/pitch/index.html)
  [![Built for HackQuest](https://img.shields.io/badge/HackQuest-0G_APAC_2026-8b5cf6?style=for-the-badge)](https://www.hackquest.io/hackathons/0G-APAC-Hackathon)

  <br/>

  ![React](https://img.shields.io/badge/React_19-20232A?style=flat&logo=react&logoColor=61DAFB)
  ![Next.js](https://img.shields.io/badge/Next.js_16-black?style=flat&logo=next.js)
  ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
  ![Tailwind](https://img.shields.io/badge/Tailwind_v4-38B2AC?style=flat&logo=tailwindcss&logoColor=white)
  ![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white)
  ![Solidity](https://img.shields.io/badge/Solidity-363636?style=flat&logo=solidity&logoColor=white)
  ![0G Network](https://img.shields.io/badge/0G_Network-8b5cf6?style=flat)
  ![Hardhat](https://img.shields.io/badge/Hardhat-FFF100?style=flat&logo=hardhat&logoColor=black)
  ![Ethers.js](https://img.shields.io/badge/Ethers.js-2535A0?style=flat)
  ![Wagmi](https://img.shields.io/badge/Wagmi-1E1E2E?style=flat)
  ![Viem](https://img.shields.io/badge/Viem-1E1E2E?style=flat)
  ![RainbowKit](https://img.shields.io/badge/RainbowKit-0E76FD?style=flat)
  ![Jest](https://img.shields.io/badge/Jest-C21325?style=flat&logo=jest&logoColor=white)
  [![CI](https://github.com/edycutjong/gochi/actions/workflows/ci.yml/badge.svg)](https://github.com/edycutjong/gochi/actions/workflows/ci.yml)

</div>

---

## 🧑‍⚖️ For Judges (Quick Start)

Welcome! If you are evaluating Gochi for the **HackQuest 0G APAC Hackathon**, here is everything you need to test the project immediately:

1. **🚀 Live App:** [gochi.edycu.dev](https://gochi.edycu.dev)
2. **📊 Pitch Deck:** [gochi.edycu.dev/pitch/index.html](https://gochi.edycu.dev/pitch/index.html)
3. **🎬 Pitch Video:** [YouTube Demo](https://youtu.be/your-video) *(Please replace `your-video` with the actual video link when published)*

**Testing Instructions:**
1. Switch your Web3 wallet (e.g., MetaMask) to the **0G Galileo Testnet** (Chain ID: 16602).
2. Connect your wallet and sign the secure authentication message.
3. Mint your first Gochi AI pet.
4. Chat with your Gochi! Every interaction and memory is securely archived on the **0G Storage Node**.

---

## 📸 See it in Action

<div align="center">
  <img src="docs/readme.png" alt="Gochi Demo" width="100%">
</div>

> **Mint, Nurture, and Evolve your AI Pet entirely on-chain using 0G Network's Storage and Compute.**

---

## 💡 The Problem & Solution
Fully decentralized, stateful AI agents require complex orchestration and expensive computation.
**Gochi** solves this by leveraging the 0G Network to deliver an engaging, low-latency Virtual Pet experience where state and AI inference live entirely on decentralized infrastructure.

**Key Features:**
- ⚡ **0G Storage Integration:** Pet memory and states are logged to the 0G decentralized KV store, creating a permanent, verifiable timeline.
- 🧠 **0G Compute AI:** Interact directly with your pet using the 0G Router; your pet remembers past interactions stored in the memory log.
- 🎨 **Retro-Cyberpunk Aesthetic:** High-fidelity pixel art and terminal UI design, fully responsive and beautifully immersive.

## 🏗️ Architecture & Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16 (App Router), React 19, Tailwind CSS v4 |
| **Smart Contracts** | Hardhat, Solidity, Ethers.js |
| **Wallet & Auth** | Wagmi, Viem, RainbowKit |
| **Storage & Compute** | 0G Storage TS SDK, 0G Compute Router |

## 🏆 Sponsor Tracks Targeted
- **0G Network Foundation:** Utilizing Storage KV/Log for pet state and the Compute Router for conversational AI capabilities.

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 20
- npm

### Installation
1. Clone: `git clone https://github.com/edycutjong/gochi.git`
2. Install: `npm install`
3. Configure: `cp .env.example .env.local`

#### 0G Galileo Testnet Setup (Required)
To interact with Gochi and the 0G Compute Router, you must use the Testnet:
1. **Add Network to MetaMask:**
   - **Network Name:** `0G Galileo Testnet`
   - **RPC URL:** `https://evmrpc-testnet.0g.ai`
   - **Chain ID:** `16602`
   - **Currency Symbol:** `A0GI`
2. **Fund Wallet:** Get free testnet tokens from the [0G Faucet](https://faucet.0g.ai).
3. **Get API Key:** Visit the [0G Compute Dashboard (Testnet)](https://pc.0g.ai/dashboard), deposit your testnet tokens, generate an API key, and add it to `.env.local` as `ROUTER_API_KEY`.

4. Run: `npm run dev`

> **For Judges:** You can interact with the pet and use the terminal interface instantly via our Live Demo link above. Wallet connection is simulated smoothly for review purposes.

## 🧪 Testing & CI
```bash
npm run lint          # ESLint
npm run typecheck     # TypeScript check
npm run test          # Run tests
npm run test:coverage # Coverage report
npm run ci            # Full CI pipeline
```

## 📁 Project Structure
```text
gochi/
├── docs/              # README assets (hero, screenshots)
├── src/
│   ├── app/          # Next.js pages and API Routes
│   ├── components/   # React components (PetViewport, ChatPanel)
│   └── lib/          # Shared utilities and types
├── contracts/        # Hardhat smart contracts
├── scripts/          # Hardhat deployment scripts
├── .env.example      # Environment template
├── .github/          # CI workflows
└── README.md         # You are here
```

## 📄 License
[MIT](LICENSE) © 2026 Edy Cu

## 🙏 Acknowledgments
Built for HackQuest 0G APAC 2026. Thank you to the 0G Foundation for the APIs and decentralized infrastructure.
