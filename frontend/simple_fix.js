const fs = require('fs');

// Read the current file
let content = fs.readFileSync('pages/boards/[slug].tsx', 'utf8');

// Find the loadBoardMessages function and make it load from WALLET PROFILE too
const oldLoadFunction = content.match(/const loadBoardMessages = async \(boardSlug: string\) => \{[\s\S]*?\n  \};/);

if (oldLoadFunction) {
  const newLoadFunction = `const loadBoardMessages = async (boardSlug: string) => {
    try {
      console.log('🔄 Loading messages for board:', boardSlug);
      
      // Load from local cache first
      const cached = await loadMessages(boardSlug);
      if (cached && cached.length > 0) {
        console.log('📋 Loaded', cached.length, 'cached messages');
        setMessages(cached as Message[]);
      }

      // ALSO load from wallet profile posts for this board
      const walletProfile = WalletAuthSystem.getCurrentProfile();
      if (walletProfile && walletProfile.posts) {
        const boardPosts = walletProfile.posts
          .filter(post => post.boardSlug === boardSlug)
          .map(post => ({
            id: post.id,
            content: post.content,
            author: {
              id: walletProfile.walletAddress,
              username: walletProfile.displayName,
              reputation: walletProfile.reputation
            },
            boardSlug: post.boardSlug,
            createdAt: new Date(post.createdAt).toISOString(),
            decayScore: 100,
            replies: 0,
            engagements: post.engagements || 0,
            isVisible: true,
            stakeTotal: post.stakeTotal || 0,
            burnedTotal: 0,
          }));
        
        if (boardPosts.length > 0) {
          console.log('👤 Found', boardPosts.length, 'posts from wallet profile');
          // Merge with existing messages, remove duplicates
          const existing = cached as Message[] || [];
          const allMessages = [...boardPosts, ...existing];
          const uniqueMessages = allMessages.filter((msg, index, arr) => 
            arr.findIndex(m => m.id === msg.id) === index
          );
          setMessages(uniqueMessages);
          console.log('📋 Total messages displayed:', uniqueMessages.length);
        }
      }

    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };`;
  
  content = content.replace(oldLoadFunction[0], newLoadFunction);
}

// Also add the import for WalletAuthSystem
if (!content.includes('WalletAuthSystem')) {
  content = content.replace(
    "import { useWalletAuth } from '../../components/WalletAuth';",
    "import { useWalletAuth } from '../../components/WalletAuth';\nimport { WalletAuthSystem } from '../../lib/wallet-auth-system';"
  );
}

fs.writeFileSync('pages/boards/[slug].tsx', content);
console.log('✅ Fixed board to load posts from wallet profile!');
