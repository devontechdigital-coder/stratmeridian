import CredentialsProvider from 'next-auth/providers/credentials';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
        orderLoginToken: { label: "Order Login Token", type: "text" }
      },
      async authorize(credentials) {
        await connectToDatabase();
        if (!credentials?.email || (!credentials?.password && !credentials?.orderLoginToken)) {
          throw new Error('Please provide email and password');
        }

        const email = credentials.email.trim().toLowerCase();
        const user = await User.findOne({ email });
        if (!user) throw new Error('Invalid email or password');
        if (user.isBlocked) throw new Error('Your account has been blocked. Please contact support.');

        let isMatch = false;
        if (credentials.orderLoginToken) {
          const tokenActive = user.orderLoginTokenHash && user.orderLoginTokenExpiresAt && user.orderLoginTokenExpiresAt > new Date();
          isMatch = tokenActive ? await bcrypt.compare(credentials.orderLoginToken, user.orderLoginTokenHash) : false;
          if (isMatch) {
            user.orderLoginTokenHash = undefined;
            user.orderLoginTokenExpiresAt = undefined;
            await user.save();
          }
        } else {
          isMatch = await bcrypt.compare(credentials.password, user.password);
        }

        if (!isMatch) throw new Error('Invalid email or password');

        const permObj = user.permissions?.toObject ? user.permissions.toObject() : (user.permissions || {});

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          permissions: permObj,
        };
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Fresh sign-in — store everything
        token.role = user.role;
        token.userId = user.id;
        token.permissions = user.permissions;
      } else if (token.userId || token.sub) {
        // Refresh from DB to handle role/permission changes
        try {
          await connectToDatabase();
          const dbUser = await User.findById(token.userId || token.sub).select('role permissions');
          if (dbUser) {
            token.role = dbUser.role;
            token.permissions = dbUser.permissions;
          }
        } catch (err) {
          console.error("JWT Refresh Error:", err);
        }
      }
      
      // Always ensure userId is present (backwards compat)
      if (!token.userId && token.sub) {
        token.userId = token.sub;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.role = token.role;
        session.user.id = token.userId || token.sub;
        session.user.permissions = token.permissions || {};
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
