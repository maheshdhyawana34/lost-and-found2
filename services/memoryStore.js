import bcrypt from 'bcryptjs';

// Pre-seeded initial data for out-of-the-box demo
const seedPassword = bcrypt.hashSync('password123', 10);

const seedUsers = [
  {
    _id: 'usr_admin_1',
    name: 'Admin SKIT',
    email: 'admin@skit.ac.in',
    password: seedPassword,
    role: 'admin',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
    collegeId: 'SKIT-ADM-01',
    phone: '+91 98290 12345',
    department: 'Campus Security & Admin',
    createdAt: new Date()
  },
  {
    _id: 'usr_student_1',
    name: 'Rahul Sharma',
    email: 'rahul.s@skit.ac.in',
    password: seedPassword,
    role: 'student',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=250',
    collegeId: '20CS104',
    phone: '+91 94140 55443',
    department: 'Computer Science Eng.',
    createdAt: new Date()
  },
  {
    _id: 'usr_student_2',
    name: 'Priya Verma',
    email: 'priya.v@skit.ac.in',
    password: seedPassword,
    role: 'student',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=250',
    collegeId: '21IT052',
    phone: '+91 88901 22334',
    department: 'Information Tech.',
    createdAt: new Date()
  }
];

const seedItems = [
  {
    _id: 'item_1',
    title: 'Apple AirPods Pro 2nd Gen in White Case',
    description: 'Found a pair of AirPods Pro 2 in a transparent silicon case near the Central Library 2nd floor reading hall table 14.',
    type: 'found',
    category: 'Electronics',
    location: 'Central Library, 2nd Floor',
    date: '2026-08-06',
    images: ['https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&q=80&w=800'],
    postedBy: seedUsers[1],
    status: 'active',
    claimCount: 1,
    secretQuestion: 'What engraving or keychain strap is attached to the case?',
    reward: 'Gratitude & Coffee',
    contactPhone: '+91 94140 55443',
    createdAt: new Date(Date.now() - 86400000)
  },
  {
    _id: 'item_2',
    title: 'Dell XPS 13 Silver Laptop with Stickers',
    description: 'Lost my silver Dell XPS laptop in Block A Auditorium during the afternoon guest lecture. Has VS Code and React stickers on the lid.',
    type: 'lost',
    category: 'Electronics',
    location: 'Block A Main Auditorium',
    date: '2026-08-07',
    images: ['https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&q=80&w=800'],
    postedBy: seedUsers[2],
    status: 'active',
    claimCount: 0,
    secretQuestion: '',
    reward: '₹1000 Cash Reward',
    contactPhone: '+91 88901 22334',
    createdAt: new Date(Date.now() - 43200000)
  },
  {
    _id: 'item_3',
    title: 'Leather Wallet with SKIT Identity Card',
    description: 'Found a dark brown leather wallet containing cash, SKIT ID card for CSE student, and metro card near Canteen Lawns.',
    type: 'found',
    category: 'Documents',
    location: 'Campus Canteen Lawns',
    date: '2026-08-05',
    images: ['https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=800'],
    postedBy: seedUsers[0],
    status: 'active',
    claimCount: 2,
    secretQuestion: 'What is the full name printed on the college ID inside?',
    reward: '',
    contactPhone: '+91 98290 12345',
    createdAt: new Date(Date.now() - 172800000)
  },
  {
    _id: 'item_4',
    title: 'Royal Enfield Bike Keys with Blue Keychain',
    description: 'Found bike key with a blue leather keychain near Parking Gate 2.',
    type: 'found',
    category: 'Keys',
    location: 'Parking Area Gate 2',
    date: '2026-08-04',
    images: ['https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&q=80&w=800'],
    postedBy: seedUsers[1],
    status: 'returned',
    claimCount: 1,
    secretQuestion: 'What text is written on the back of the keychain?',
    reward: '',
    contactPhone: '+91 94140 55443',
    createdAt: new Date(Date.now() - 259200000)
  }
];

class MemoryStore {
  constructor() {
    this.users = [...seedUsers];
    this.items = [...seedItems];
    this.claims = [];
    this.chats = [];
    this.notifications = [
      {
        _id: 'notif_1',
        user: 'usr_student_2',
        title: 'Welcome to SKIT Lost & Found Portal',
        message: 'Report lost items or help fellow batchmates locate their belongings.',
        link: '/items',
        read: false,
        createdAt: new Date()
      }
    ];
  }

  // Users
  findUserByEmail(email) {
    return this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  findUserById(id) {
    return this.users.find(u => u._id === id?.toString());
  }

  createUser(userData) {
    const newUser = {
      _id: 'usr_' + Date.now(),
      ...userData,
      createdAt: new Date()
    };
    this.users.push(newUser);
    return newUser;
  }

  // Items
  getItems({ search, category, type, location, status }) {
    let list = [...this.items];
    if (type && type !== 'all') {
      list = list.filter(i => i.type === type);
    }
    if (category && category !== 'all') {
      list = list.filter(i => i.category.toLowerCase() === category.toLowerCase());
    }
    if (status && status !== 'all') {
      list = list.filter(i => i.status === status);
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(i => 
        i.title.toLowerCase().includes(q) || 
        i.description.toLowerCase().includes(q) ||
        i.location.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  getItemById(id) {
    return this.items.find(i => i._id === id);
  }

  createItem(itemData, user) {
    const newItem = {
      _id: 'item_' + Date.now(),
      ...itemData,
      postedBy: user,
      claimCount: 0,
      status: 'active',
      createdAt: new Date()
    };
    this.items.unshift(newItem);
    return newItem;
  }

  updateItem(id, updateData) {
    const idx = this.items.findIndex(i => i._id === id);
    if (idx !== -1) {
      this.items[idx] = { ...this.items[idx], ...updateData };
      return this.items[idx];
    }
    return null;
  }

  deleteItem(id) {
    const idx = this.items.findIndex(i => i._id === id);
    if (idx !== -1) {
      this.items.splice(idx, 1);
      return true;
    }
    return false;
  }

  // Claims
  createClaim(claimData) {
    const newClaim = {
      _id: 'claim_' + Date.now(),
      ...claimData,
      status: 'pending',
      createdAt: new Date()
    };
    this.claims.unshift(newClaim);

    // Increment item claim count
    const item = this.getItemById(claimData.item);
    if (item) {
      item.claimCount = (item.claimCount || 0) + 1;
    }
    return newClaim;
  }

  getClaimsForItem(itemId) {
    return this.claims.filter(c => c.item === itemId || c.item?._id === itemId);
  }

  getClaimsForUser(userId) {
    return this.claims.filter(c => c.claimant === userId || c.claimant?._id === userId);
  }

  updateClaimStatus(claimId, status, responseNote = '') {
    const claim = this.claims.find(c => c._id === claimId);
    if (claim) {
      claim.status = status;
      claim.responseNote = responseNote;
      if (status === 'approved') {
        const item = this.getItemById(claim.item);
        if (item) item.status = 'claimed';
      }
      return claim;
    }
    return null;
  }

  // Chat
  addChatMessage(msg) {
    const newMsg = {
      _id: 'msg_' + Date.now(),
      ...msg,
      read: false,
      createdAt: new Date()
    };
    this.chats.push(newMsg);
    return newMsg;
  }

  getChatMessages(itemId, user1Id, user2Id) {
    return this.chats.filter(c => 
      c.item === itemId && 
      ((c.sender === user1Id && c.receiver === user2Id) || (c.sender === user2Id && c.receiver === user1Id))
    );
  }

  // Notifications
  addNotification(notif) {
    const newNotif = {
      _id: 'notif_' + Date.now(),
      ...notif,
      read: false,
      createdAt: new Date()
    };
    this.notifications.unshift(newNotif);
    return newNotif;
  }

  getNotificationsForUser(userId) {
    return this.notifications.filter(n => n.user === userId);
  }

  markNotificationRead(notifId) {
    const notif = this.notifications.find(n => n._id === notifId);
    if (notif) notif.read = true;
    return notif;
  }
}

export const memoryStore = new MemoryStore();
