import bcrypt from 'bcryptjs';
import User  from '../../models/user';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end(); // Allow only POST method

  const { email, password } = req.body;

  console.log('Login attempt:', { email, password });

  if (!email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    // Check if the user exists
    const user = await User?.findOne({ where: { email } });

    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    // Check if the password is correct
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create session with user details
    req.session.user = { id: user.id, email: user.email, name: user.name, role: user.role };

    res.status(200).json({ message: 'Login successful', user: req.session.user });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong', error });
  }
}