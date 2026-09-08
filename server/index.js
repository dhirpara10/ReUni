const express = require('express');
const cors = require('cors');
require('dotenv').config();
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const sendVerificationEmail = require('./mailer');


const app = express();
app.use(cors());
app.use(express.json());

const supabase = require('./supabaseClient');

app.get('/', (req, res) => res.send('ReUni API running'));

// Allowed campus email domain
const ALLOWED_DOMAIN = '@my.holmes.edu.au';'@gmail.com' // change this to your real domain

app.post('/signup', async (req, res) => {
  try {
    const { full_name, email, password } = req.body;

    // 1. Basic validation
    if (!full_name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    // 2. Campus email domain check
    if (!email.toLowerCase().endsWith(ALLOWED_DOMAIN)) {
      return res.status(400).json({ error: `Only ${ALLOWED_DOMAIN} emails are allowed.` });
    }

    // 3. Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    // 4. Hash the password
    const password_hash = await bcrypt.hash(password, 10);

    // 5. Insert new user (unverified)
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([{ full_name, email: email.toLowerCase(), password_hash, is_verified: false }])
      .select()
      .single();

    if (insertError) throw insertError;

    // 6. Generate verification token
    const token = uuidv4();
    const expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    const { error: tokenError } = await supabase
      .from('verification_tokens')
      .insert([{ user_id: newUser.id, token, expires_at }]);

    if (tokenError) throw tokenError;

       // 7. Send verification email
    const verificationLink = `http://localhost:5001/verify?token=${token}`;
    await sendVerificationEmail(email, verificationLink);

    res.status(201).json({
      message: 'Account created. Please check your email to verify your account.'
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

app.get('/verify', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).send('Missing verification token.');
    }

    // 1. Find the token
    const { data: tokenRow, error: tokenError } = await supabase
      .from('verification_tokens')
      .select('*')
      .eq('token', token)
      .single();

    if (tokenError || !tokenRow) {
      return res.status(400).send('Invalid or expired verification link.');
    }

    // 2. Check expiry
    if (new Date(tokenRow.expires_at) < new Date()) {
      return res.status(400).send('This verification link has expired.');
    }

    // 3. Mark user as verified
    const { error: updateError } = await supabase
      .from('users')
      .update({ is_verified: true })
      .eq('id', tokenRow.user_id);

    if (updateError) throw updateError;

    // 4. Delete the used token
    await supabase
      .from('verification_tokens')
      .delete()
      .eq('id', tokenRow.id);

    res.send('✅ Email verified successfully! You can now log in.');

  } catch (err) {
    console.error(err);
    res.status(500).send('Something went wrong during verification.');
  }
});

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Basic validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // 2. Find the user
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (findError || !user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // 3. Check password match
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // 4. Check verification status
    if (!user.is_verified) {
      return res.status(403).json({ error: 'Please verify your campus email before logging in.' });
    }

    // 5. Success — for now return basic user info (no session/token yet)
    res.status(200).json({
      message: 'Login successful.',
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

// Create a new item listing
app.post('/items', async (req, res) => {
  try {
    const { seller_id, title, description, category, condition, exchange_type, price, image_url } = req.body;

    if (!seller_id || !title || !category || !condition || !exchange_type) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    const { data: newItem, error } = await supabase
      .from('items')
      .insert([{
        seller_id,
        title,
        description,
        category,
        condition,
        exchange_type,
        price: exchange_type === 'Sell' ? price : null,
        image_url
      }])
      .select()
      .single();

    if (error) throw error;

    // Check wishlist matches (simple keyword match against title)
    const { data: matches } = await supabase
      .from('wishlist')
      .select('*, users(email, full_name)')
      .ilike('keyword', `%${title}%`);

    if (matches && matches.length > 0) {
      console.log(`Wishlist match found for "${title}":`, matches.map(m => m.users.email));
      // Future step: send email alerts to these users
    }

    res.status(201).json({ message: 'Item posted successfully.', item: newItem, wishlist_matches: matches?.length || 0 });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

// Get all items (with optional category filter)
app.get('/items', async (req, res) => {
  try {
    const { category } = req.query;

    let query = supabase
      .from('items')
      .select('*, users(full_name)')
      .eq('status', 'Available')
      .order('created_at', { ascending: false });

    if (category && category !== 'All') {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) throw error;

    res.status(200).json({ items: data });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

// Get a single item by ID
app.get('/items/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('items')
      .select('*, users(full_name, email)')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Item not found.' });
    }

    res.status(200).json({ item: data });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});



// Add item to wishlist
app.post('/wishlist', async (req, res) => {
  try {
    const { user_id, keyword, category } = req.body;

    if (!user_id || !keyword) {
      return res.status(400).json({ error: 'user_id and keyword are required.' });
    }

    const { data, error } = await supabase
      .from('wishlist')
      .insert([{ user_id, keyword, category: category || null }])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // unique constraint violation
        return res.status(409).json({ error: 'This item is already on your wishlist.' });
      }
      throw error;
    }

    res.status(201).json({ message: 'Added to wishlist.', wishlist_item: data });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

// Get a user's wishlist
app.get('/wishlist/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;

    const { data, error } = await supabase
      .from('wishlist')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.status(200).json({ wishlist: data });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

// Remove item from wishlist
app.delete('/wishlist/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('wishlist')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.status(200).json({ message: 'Removed from wishlist.' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});



// Send a message
app.post('/messages', async (req, res) => {
  try {
    const { item_id, sender_id, receiver_id, content } = req.body;

    if (!item_id || !sender_id || !receiver_id || !content) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const { data, error } = await supabase
      .from('messages')
      .insert([{ item_id, sender_id, receiver_id, content }])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ message: 'Message sent.', data });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

// Get conversation for a specific item between two users
app.get('/messages/:item_id/:user_a/:user_b', async (req, res) => {
  try {
    const { item_id, user_a, user_b } = req.params;

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('item_id', item_id)
      .or(`and(sender_id.eq.${user_a},receiver_id.eq.${user_b}),and(sender_id.eq.${user_b},receiver_id.eq.${user_a})`)
      .order('created_at', { ascending: true });

    if (error) throw error;

    res.status(200).json({ messages: data });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

// Get all conversations for a user (inbox view — grouped by item)
app.get('/inbox/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;

    const { data, error } = await supabase
      .from('messages')
      .select('*, items(title), sender:sender_id(full_name), receiver:receiver_id(full_name)')
      .or(`sender_id.eq.${user_id},receiver_id.eq.${user_id}`)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.status(200).json({ messages: data });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));