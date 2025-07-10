# RepoDock.dev

**AI Powered Workspace, Built to Save You Time**

RepoDock is a modern developer workspace that manages your projects, tasks, and environment variables with 256-bit encryption. Built with Next.js, TypeScript, and modern web technologies for optimal developer experience.

![RepoDock Dashboard](https://via.placeholder.com/800x400/1a1a1a/ffffff?text=RepoDock+Dashboard)

## ✨ Features

### 🏢 Multiple Workspaces
- Organize your projects across different workspaces
- Easy workspace switching and management
- Default workspace creation for new users

### 📁 Project Management
- Create and manage multiple projects within each workspace
- Project status tracking (Active, Draft, Archived)
- Repository URL linking with external access
- Detailed project information and metadata

### 🔐 256-bit Encryption
- Military-grade encryption for environment variables
- Secure local storage with encrypted values
- Master key generation and management
- PBKDF2 key derivation with 10,000 iterations

### 🎨 Modern UI/UX
- Beautiful, minimal interface with Inter font
- Dark and light theme support with system preference detection
- Responsive design for desktop, tablet, and mobile
- shadcn/ui components for consistent design

### 🔧 Environment Variables
- Global and per-project environment variable management
- Secure encryption/decryption with visual indicators
- Secret variable marking and protection
- Copy-to-clipboard functionality

### 📋 Task Management (Coming Soon)
- Built-in task management with priorities
- Assignment and due date tracking
- Status management and progress tracking

### 🔀 Pull Request Tracking (Coming Soon)
- Track and manage pull requests across repositories
- Integration with version control systems
- Status and review management

### 🐛 Issue Tracking (Coming Soon)
- Comprehensive issue tracking with categories
- Priority and assignment management
- Status tracking and resolution

## 🚀 Tech Stack

- **Framework**: Next.js 15.3.5 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **State Management**: Zustand
- **Validation**: Zod
- **Icons**: Lucide React
- **UI Components**: Radix UI primitives
- **Encryption**: CryptoJS (AES-256-CBC)
- **Font**: Inter (Google Fonts)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/repodock.git
   cd repodock
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   # or
   npm install
   # or
   yarn install
   ```

3. **Start the development server**
   ```bash
   pnpm dev
   # or
   npm run dev
   # or
   yarn dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎯 Quick Start

### Demo Account
Use these credentials to explore RepoDock:
- **Username**: `demo`
- **Password**: `demo123`

### Creating Your Account
1. Click "Get Started" on the landing page
2. Fill in your username, email, and password
3. Your account and default workspace will be created automatically
4. Start creating projects and managing your development workflow

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── dashboard/         # Dashboard layout and pages
│   ├── globals.css        # Global styles and theme variables
│   ├── layout.tsx         # Root layout with metadata
│   └── page.tsx           # Landing page
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components (Button, Input, Modal, etc.)
│   ├── GlobalEnv.tsx     # Global environment variables
│   ├── ProjectList.tsx   # Project list sidebar
│   ├── ProjectNav.tsx    # Project navigation tabs
│   ├── Sidebar.tsx       # Main sidebar navigation
│   └── WorkspaceToggle.tsx # Workspace switcher
├── features/             # Feature-specific components and stores
│   ├── auth/            # Authentication (forms, store)
│   ├── projects/        # Project management
│   └── workspaces/      # Workspace management
├── lib/                 # Utility libraries
│   ├── encryption.ts    # 256-bit encryption service
│   ├── localdb.ts       # Local storage database
│   ├── utils.ts         # Utility functions
│   └── zodSchemas.ts    # Validation schemas
└── types/               # TypeScript type definitions
    └── index.ts         # All application types
```

## 🔒 Security Features

### Encryption
- **Algorithm**: AES-256-CBC
- **Key Derivation**: PBKDF2 with SHA-256
- **Iterations**: 10,000
- **Salt**: Random 256-bit salt per encryption
- **IV**: Random 128-bit initialization vector

### Data Storage
- All sensitive data encrypted before localStorage
- Master keys generated per user
- No plain text storage of sensitive information
- Secure key rotation support

## 🎨 Theming

RepoDock supports both light and dark themes with:
- System preference detection
- Manual theme switching
- Persistent theme selection
- Smooth transitions between themes

## 📱 Responsive Design

- **Desktop**: Full feature set with sidebar navigation
- **Tablet**: Optimized layout with collapsible sidebar
- **Mobile**: Touch-friendly interface with mobile navigation

## 🧪 Development

### Available Scripts

- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

### Code Quality

- TypeScript for type safety
- ESLint for code quality
- Prettier for code formatting
- Modern React patterns with hooks

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing React framework
- [Tailwind CSS](https://tailwindcss.com/) for utility-first CSS
- [Radix UI](https://radix-ui.com/) for accessible UI primitives
- [Lucide](https://lucide.dev/) for beautiful icons
- [Zustand](https://zustand-demo.pmnd.rs/) for simple state management

---

**Built with ❤️ for developers by developers**

For questions, suggestions, or support, please open an issue or contact us at [support@repodock.dev](mailto:support@repodock.dev).
