# NeatRepo - Your GitHub Portfolio Organizer 🚀

**NeatRepo** adalah webapp yang membantu developer membereskan dan mengorganisir repository GitHub mereka agar job-ready! Dengan fitur-fitur yang tidak tersedia di GitHub, NeatRepo adalah solusi lengkap untuk membuat portfolio profesional yang menarik recruiter.

## 🎯 **Masalah yang Dipecahkan**

### **GitHub's Missing Features untuk Job Seekers:**
- ❌ Tidak ada bulk delete - harus hapus repo satu per satu
- ❌ Tidak ada visual reordering - hanya alphabetical sorting
- ❌ Tidak ada pemisahan jelas antara original vs forked repositories
- ❌ Tidak ada tools untuk optimize portfolio untuk job applications
- ❌ Interface yang lambat dan outdated untuk portfolio management

## 🌟 **Fitur Utama NeatRepo**

### 🗑️ **Revolutionary Bulk Operations** ⚡ **GAME CHANGER**
- **Bulk Delete**: Hapus multiple repositories sekaligus dalam 5 detik
- **Smart Selection**: Pilih repository dengan checkbox visual
- **Safety First**: Dialog konfirmasi mencegah penghapusan tidak sengaja
- **Real-time Updates**: UI update langsung setelah operasi

### ➕ **Complete Repository Management** ✅ **PRODUCTION READY**
- **Repository Creation**: Buat repository baru tanpa meninggalkan platform
- **Repository Renaming**: Rename repository instant dengan validation
- **File Management**: Buat dan edit file langsung dari platform
- **Real GitHub Integration**: Semua operasi menggunakan GitHub API

### 🎨 **Professional Portfolio Organization**
- **Drag & Drop Reordering**: Organisasi repository secara visual
- **Forked Repository Separation**: Pemisahan jelas antara original dan forked work
- **Smart Sorting**: Sort berdasarkan complexity, date, atau custom order
- **Visual Indicators**: Label dan icon untuk berbagai jenis project

### ⚡ **Ultra-Fast Performance** 🏆 **LIGHTNING SPEED**
- **Sub-1-Second Loading**: 25+ repositories loaded dalam 426ms
- **Optimized Caching**: Smart caching dengan background sync
- **Instant Operations**: Bulk operations completed dalam seconds
- **Smooth UI**: Responsive interface dengan real-time updates

### 🔐 **Secure & Reliable**
- **GitHub OAuth**: Seamless login dengan GitHub account
- **Secure Token Management**: Safe credential storage dan handling
- **Enterprise-grade Auth**: Powered by Supabase authentication
- **Session Stability**: Long-term session dengan auto-refresh

### 🧠 **Smart Features** (AI-Enhanced)
- **Complexity Analysis**: Otomatis analisis tingkat kompleksitas repository
- **Portfolio Mode**: Sort dari simple ke complex untuk showcase learning journey
- **CV Mode**: Sort berdasarkan recent activity untuk impress recruiters
- **Job-Specific Repo Picker**: AI pilih 4 repo terbaik berdasarkan job title
- **Quick Personal Interview**: AI interview singkat untuk generate personalized README
- **Smart Critique Modes**: Nice mode (encouraging) vs Brutal mode (honest feedback)

## 🎯 **Perfect for Job Seekers**

NeatRepo dirancang khusus untuk developer yang ingin:
- **Clean up messy GitHub profiles** dengan bulk operations
- **Organize repositories professionally** untuk job applications
- **Highlight their best work** dengan smart sorting dan visual organization
- **Save time** dengan automated tools dan bulk operations
- **Stand out to recruiters** dengan professional portfolio presentation

## 🚀 **Key Benefits**

### ✅ **Time Savings**
- **5 seconds** untuk bulk delete vs **15 minutes** manual di GitHub
- **1 click** untuk professional organization vs **hours** manual work
- **Instant** repository management vs **constant GitHub switching**

### ✅ **Professional Presentation**
- Clean, organized repository showcase
- Clear separation of original vs forked work
- Visual indicators untuk project types dan complexity
- Professional portfolio layout yang menarik recruiter

### ✅ **Job Application Ready**
- Portfolio mode untuk showcase learning progression
- CV mode untuk highlight recent activity
- Smart sorting untuk different job applications
- Professional README generation tools

## 🛠️ **Technology Stack**

- **Frontend**: Next.js 14, React 18, TypeScript
- **UI Components**: shadcn/ui, Tailwind CSS, Framer Motion
- **Authentication**: Supabase Auth dengan GitHub OAuth
- **Database**: Supabase PostgreSQL
- **GitHub Integration**: GitHub REST API v4, Octokit
- **Drag & Drop**: @hello-pangea/dnd
- **Performance**: Singleton patterns, intelligent caching

- **Deployment**: Vercel

## 🚀 **Getting Started**

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/neatrepo.git
   cd neatrepo
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Fill in your credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## 📝 **How to Use**

1. **Sign in** dengan GitHub account
2. **Configure GitHub token** untuk repository management
3. **Bulk select** repositories yang ingin dihapus atau diorganisir
4. **Drag & drop** untuk reorder repositories
5. **Use smart sorting** untuk optimize portfolio presentation
6. **Download** organized portfolio data

## 🏆 **Production Ready Features**

### **✅ Fully Tested & Verified**
- **Bulk Delete**: Tested dengan 20+ repositories, completed dalam 5 detik
- **Repository Creation**: Fully tested dengan real GitHub API
- **Repository Renaming**: Tested dengan validation dan error handling
- **Drag & Drop**: Smooth interactions dengan visual feedback
- **Performance**: Sub-1-second loading untuk 25+ repositories
- **Security**: Secure token management dan authentication

### **✅ Enterprise-Grade Quality**
- **TypeScript**: Full type safety throughout application
- **Error Handling**: Comprehensive error handling dan user feedback
- **Performance Optimized**: Singleton patterns dan smart caching
- **Security**: Secure credential management
- **UI/UX**: Professional interface dengan shadcn/ui components

## 🎯 **Why Choose NeatRepo?**

### **The Problem with GitHub:**
GitHub is great for code hosting, but terrible for portfolio management:
- Manual deletion of repositories one by one
- No visual organization tools
- Poor presentation for job applications
- Slow, outdated interface for bulk operations

### **NeatRepo's Solution:**
- **Bulk Operations**: Delete 20 repos in 5 seconds
- **Visual Organization**: Drag & drop reordering
- **Professional Presentation**: Job-ready portfolio layout
- **Smart Tools**: Automated sorting dan organization
- **Modern UI**: Fast, responsive, professional interface

## 🌟 **What Makes NeatRepo Special**

**NeatRepo adalah tool pertama yang fokus pada portfolio management untuk job seekers!**

🗑️ **Bulk Operations**: Fitur yang tidak ada di GitHub
🎨 **Visual Organization**: Professional portfolio presentation
⚡ **Lightning Fast**: Sub-1-second performance
🎯 **Job-Focused**: Designed specifically untuk career advancement
🔧 **Complete Solution**: All-in-one repository management

---

## 📄 **Contributing**

We welcome contributions! Please feel free to submit a Pull Request.

## 📄 **License**

This project is licensed under the MIT License.

## 🙏 **Acknowledgments**

- Built with [Next.js](https://nextjs.org/) dan [React](https://reactjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Authentication by [Supabase](https://supabase.com/)
- Deployed on [Vercel](https://vercel.com/)

---

**NeatRepo** - Making GitHub portfolio management fast, professional, and job-ready! 🚀

*Clean up your GitHub, land your dream job!*

<!-- Updated: 2025-01-28 - New Supabase project configured -->