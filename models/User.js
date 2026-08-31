import mongoose from "mongoose";

const permissionSchema = {
  view: { type: Boolean, default: false },
  edit: { type: Boolean, default: false },
};

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide a name for this user."],
      maxlength: [60, "Name cannot be more than 60 characters"],
    },
    email: {
      type: String,
      required: [true, "Please provide an email for this user."],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: [100, "Email cannot be more than 100 characters"],
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Please provide a password."],
      minlength: [6, "Password must be at least 6 characters"],
    },
    role: {
      type: String,
      enum: ["user", "admin", "sub-admin"],
      default: "user",
    },
    phone: String,
    phoneCountry: {
      type: String,
      default: "US",
    },
    address: String,
    city: String,
    state: String,
    country: String,
    permissions: {
      users: permissionSchema,
      pages: permissionSchema,
      categories: permissionSchema,
      services: permissionSchema,
      orders: permissionSchema,
      enquiries: permissionSchema,
      gallery: permissionSchema,
      settings: permissionSchema,
      dashboard: permissionSchema,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    orderLoginTokenHash: String,
    orderLoginTokenExpiresAt: Date,
  },
  { timestamps: true }
);

UserSchema.pre("validate", function normalizeEmail() {
  if (this.email) {
    this.email = this.email.trim().toLowerCase();
  }
});

export default mongoose.models.User || mongoose.model("User", UserSchema);
