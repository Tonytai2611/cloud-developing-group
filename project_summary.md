# BrewCraft - Project Architecture & Implementation Summary

## 📋 Project Overview

**BrewCraft** là một hệ thống quản lý quán cafe toàn diện, sử dụng **AWS Serverless Architecture** kết hợp với **React frontend** và **Express.js backend**.

---

## 🏗️ Project Structure

```
cloud-developing-group/
├── src/                          # Frontend React Application
│   ├── components/
│   │   ├── application_component/
│   │   │   ├── Header.jsx        # User navigation header
│   │   │   ├── AdminHeader.jsx   # Admin navigation header
│   │   │   ├── Footer.jsx
│   │   │   ├── Hero.jsx
│   │   │   └── IntroductionComponent.jsx
│   │   └── auth/
│   │       ├── Login.jsx
│   │       └── Signup.jsx
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── Menu.jsx              # Customer menu browsing
│   │   ├── Booking.jsx           # Table booking & food ordering
│   │   ├── Table.jsx
│   │   ├── ContactUs.jsx         # Contact form with Step Functions
│   │   ├── UserProfile.jsx
│   │   ├── VerifyEmail.jsx
│   │   ├── UserChatPage.jsx      # Customer chat with admin
│   │   └── admin/
│   │       ├── Admin.jsx                      # Admin dashboard
│   │       ├── AdminManageMenuCategory.jsx    # Menu category list
│   │       ├── AdminMenuCategoryForm.jsx      # Add/Edit menu category
│   │       ├── AdminManageTable.jsx           # Table management
│   │       ├── AdminManageOrderingFood.jsx    # Order management
│   │       └── AdminChatWithUsers.jsx         # Admin chat interface
│   ├── services/
│   │   ├── menuApi.js            # Menu CRUD + Image Upload
│   │   ├── tableApi.js           # Table CRUD
│   │   └── bookingApi.js         # Booking CRUD
│   └── App.jsx                   # Routes + Toaster setup
│
├── server/
│   └── index.js                  # Express server (proxy to AWS)
│
├── lambda/                       # AWS Lambda Functions
│   ├── contact_handler.py        # Contact form → Step Functions
│   ├── validate_contact_input.py # Step Functions validation
│   ├── upload_image_handler.py   # S3 image upload
│   ├── booking_handler.py        # Booking CRUD
│   ├── lambda_menu_handler.py    # Menu CRUD
│   └── chat_handler.py           # WebSocket chat handler
│
└── public/
    └── brewcraft.png             # Logo
```

---

## 🔧 Technology Stack

### Frontend
- **React 18** - UI framework
- **React Router** - Client-side routing
- **Lucide React** - Icon library
- **Sonner** - Toast notifications (thay thế `alert()`)
- **Tailwind CSS** - Styling

### Backend
- **Express.js** - API proxy server
- **AWS SDK** - Lambda invocation, Cognito, DynamoDB
- **Cookie-based authentication**

### AWS Services
- **API Gateway** - REST API endpoints
- **Lambda** - Serverless functions
- **DynamoDB** - NoSQL database
- **S3** - Image storage (`brewcraft-images` bucket)
- **Cognito** - User authentication
- **Step Functions** - Contact form workflow
- **WebSocket API** - Real-time chat

---

## 🎯 Key Features Implemented

### 1. **User Authentication** (AWS Cognito)
- Registration với email verification
- Login/Logout với session cookies
- Role-based access (Customer/Admin)
- `/api/me` endpoint để check user status

### 2. **Menu Management**
**Customer Side:**
- Browse menu với categories filter
- Search dishes
- Add to cart
- View full descriptions (không bị truncate)

**Admin Side:**
- CRUD menu categories
- CRUD dishes (name, description, price, image)
- Image upload qua S3
- Limit 6 dishes per category

### 3. **Table Management** (Admin)
- CRUD tables
- Table status: AVAILABLE, RESERVED
- Seats configuration (2-10)
- Cannot delete occupied tables

### 4. **Booking & Ordering**
**Customer:**
- Select table + date/time/guests
- Order food from menu
- Special requests
- Submit booking

**Admin:**
- View all bookings
- Filter: ALL, PENDING, CONFIRMED
- Approve/Reject bookings
- Delete bookings
- Revenue statistics

### 5. **Contact Us** (Step Functions Workflow)
- Form submission → API Gateway
- Lambda trigger Step Functions
- Validation → SNS → SQS
- Toast notifications cho success/error

### 6. **Real-time Chat** (WebSocket)
**Customer:**
- Chat với admin
- Real-time message delivery
- Online status

**Admin:**
- View all online customers
- Multi-user chat management
- Message history
- Notifications cho new messages

### 7. **Image Upload**
- Frontend: Convert file → base64
- API Gateway → Lambda
- Lambda: Decode → Detect content type → S3 upload
- Return public S3 URL

### 8. **Toast Notifications**
Thay thế tất cả `alert()` và `window.confirm()` bằng **Sonner toasts**:
- Success: Green
- Error: Red với description
- Warning: Yellow
- Info: Blue
- Position: top-right
- Auto-dismiss: 3s

---

## 🔄 Data Flow Logic

### Menu CRUD Flow
```
User Action (Menu.jsx)
    ↓
menuApi.js (fetch to API Gateway)
    ↓
API Gateway: /getMenu, /createMenuItem, /updateMenuItem, /deleteMenuItem
    ↓
Lambda: lambda_menu_handler.py
    ↓
DynamoDB: MENU_TABLE
    ↓
Response → Frontend → Toast notification
```

### Booking Flow
```
Customer (Booking.jsx)
    ↓
Select items from cart + table + date/time
    ↓
bookingApi.create() → API Gateway
    ↓
Lambda: booking_handler.py
    ↓
DynamoDB: BOOKINGS_TABLE
    ↓
Update table status to RESERVED
    ↓
Toast: "Booking submitted successfully"
```

### Admin Approval Flow
```
Admin (AdminManageOrderingFood.jsx)
    ↓
Click "Approve" button
    ↓
bookingApi.updateStatus(id, 'CONFIRMED')
    ↓
Lambda: booking_handler.py
    ↓
DynamoDB: Update status
    ↓
Refresh data → Toast: "Booking confirmed"
```

### Image Upload Flow
```
Admin selects image file
    ↓
menuApi.uploadImage(file)
    ↓
Convert to base64
    ↓
POST to API Gateway /upload
    ↓
Lambda: upload_image_handler.py
    ↓
Decode base64 → Detect MIME type
    ↓
S3 PutObject (public-read ACL)
    ↓
Return S3 URL
    ↓
Update dish.image field
```

### WebSocket Chat Flow
```
User connects: wss://...?userId=email&role=customer
    ↓
Lambda: chat_handler.py (onConnect)
    ↓
DynamoDB: CONNECTIONS_TABLE (store connectionId)
    ↓
Admin sends: getUsers action
    ↓
Lambda returns: userList (all online customers)
    ↓
User selects customer → getMessages action
    ↓
Lambda returns: messageHistory
    ↓
User sends message → sendMessage action
    ↓
Lambda: Store in MESSAGES_TABLE
    ↓
Broadcast to recipient via connectionId
    ↓
Real-time message appears in both UIs
```

### Contact Form Flow (Step Functions)
```
User submits form (ContactUs.jsx)
    ↓
POST to API Gateway /contact
    ↓
Lambda: contact_handler.py
    ↓
Trigger Step Functions: ContactWorkflow
    ↓
Step 1: validate_contact_input.py
    ↓
Step 2: SNS Publish (email notification)
    ↓
Step 3: SQS SendMessage (queue for processing)
    ↓
Return success → Toast: "Message sent successfully"
```

---

## 🎨 UI/UX Improvements

### Toast Notifications
**Before:**
```javascript
alert('Menu created successfully!');
window.confirm('Are you sure?');
```

**After:**
```javascript
toast.success("Menu created successfully!");
toast.error("Failed to save", { description: error.message });
toast.warning("Maximum dishes reached");
```

### Navigation Consistency
Tất cả admin pages có:
- **Back to Dashboard** button
- **Home** button
- Consistent styling với teal theme

### Menu Display
- Removed `line-clamp-2` để hiển thị full description
- Cards tự động adjust height
- Better readability

---

## 🔐 Security & Authentication

### Cookie-based Sessions
```javascript
// server/index.js
res.setHeader('Set-Cookie', serialize('userInfo', JSON.stringify({
  email, role, accessToken
}), { httpOnly: true, path: '/' }));
```

### Protected Routes
- Admin routes check role từ cookie
- `/api/me` endpoint để verify authentication
- Cognito JWT tokens

### S3 Security
- Public-read ACL cho uploaded images
- Content-Type validation
- File size limits (implicit)

---

## 📊 Database Schema (DynamoDB)

### USERS_TABLE
```
PK: email
Attributes: role, name, phone, etc.
```

### MENU_TABLE
```
PK: id (category id)
Attributes: {
  title: string,
  dishes: [{
    name, description, price, image
  }]
}
```

### BOOKINGS_TABLE
```
PK: id (booking id)
Attributes: {
  customerName, email, phone,
  date, time, guests,
  tableId, status (PENDING/CONFIRMED/REJECTED),
  selectedItems: [{name, price, quantity}],
  total, specialRequests
}
```

### TABLES_TABLE
```
PK: id
Attributes: {
  tableNumber, seats, status (AVAILABLE/RESERVED)
}
```

### CONNECTIONS_TABLE (WebSocket)
```
PK: connectionId
Attributes: {
  userId (email), role, timestamp
}
```

### MESSAGES_TABLE
```
PK: messageId
Attributes: {
  senderId, recipientId, message, timestamp
}
```

---

## 🚀 Recent Improvements (This Session)

### 1. Fixed Admin Navigation
- Added missing route `/admin/manage-menu/form` in `App.jsx`
- Resolved "Add New Category" button navigation issue

### 2. Replaced All Alerts with Toasts
**Files Updated:**
- `src/App.jsx` - Added Toaster component
- `src/components/application_component/Header.jsx`
- `src/components/application_component/AdminHeader.jsx`
- `src/components/auth/Signup.jsx`
- `src/pages/Booking.jsx`
- `src/pages/ContactUs.jsx`
- `src/pages/UserProfile.jsx`
- `src/pages/VerifyEmail.jsx`
- `src/pages/admin/AdminManageMenuCategory.jsx`
- `src/pages/admin/AdminMenuCategoryForm.jsx`
- `src/pages/admin/AdminManageTable.jsx`
- `src/pages/admin/AdminManageOrderingFood.jsx`

### 3. Image Upload Pipeline
- Created `lambda/upload_image_handler.py`
- Updated `menuApi.js` to use API Gateway
- Added `/api/upload` endpoint in Express (fallback)
- Base64 encoding/decoding logic

### 4. Menu Display Enhancement
- Removed description truncation in `Menu.jsx`
- Full text display for better UX

### 5. Admin Chat Navigation
- Added "Back to Dashboard" and "Home" buttons
- Consistent with other admin pages

---

## 🎯 Architecture Highlights

### Serverless Benefits
- **Scalability**: Auto-scaling Lambda functions
- **Cost-effective**: Pay per request
- **No server management**: AWS handles infrastructure

### Separation of Concerns
- **Frontend**: Pure React, no business logic
- **API Layer**: Express proxy + API Gateway
- **Business Logic**: Lambda functions
- **Data Layer**: DynamoDB

### Real-time Communication
- WebSocket API cho instant messaging
- Connection management trong DynamoDB
- Broadcast messages to specific users

### Workflow Orchestration
- Step Functions cho complex workflows (Contact form)
- Error handling và retry logic
- Integration với SNS, SQS

---

## 📝 Environment Variables

```env
# AWS Credentials
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_SESSION_TOKEN=
AWS_REGION=us-east-1

# Cognito
COGNITO_CLIENT_ID=
COGNITO_CLIENT_SECRET=

# DynamoDB Tables
USERS_TABLE=
MENU_TABLE=
BOOKINGS_TABLE=
TABLES_TABLE=

# API Gateway
REACT_APP_API_BASE_URL=https://4jawv6e5e1.execute-api.us-east-1.amazonaws.com
REACT_APP_CONTACT_API_URL=https://hn030bsgek.execute-api.us-east-1.amazonaws.com/contact

# S3
S3_BUCKET_NAME=brewcraft-images

# WebSocket
WS_URL=wss://3w3qjyvvl9.execute-api.us-east-1.amazonaws.com/production
```

---

## 🎨 Design System

### Colors
- **Primary**: Teal (`#14b8a6`)
- **Success**: Green
- **Error**: Red
- **Warning**: Yellow
- **Info**: Blue

### Components
- Rounded corners: `rounded-lg`, `rounded-xl`
- Shadows: `shadow-md`, `shadow-lg`
- Transitions: `transition-all`
- Hover effects: `hover:bg-teal-600`

---

## 🔮 Future Enhancements

1. **Payment Integration** (Stripe/PayPal)
2. **Email Notifications** (SES)
3. **Analytics Dashboard** (Revenue, Popular dishes)
4. **Mobile App** (React Native)
5. **Inventory Management**
6. **Staff Management**
7. **Loyalty Program**

---

## 📚 Key Learnings

### AWS Integration
- Lambda function invocation từ Express
- API Gateway CORS configuration
- DynamoDB query patterns
- S3 public access policies

### React Best Practices
- Component composition
- State management với hooks
- API service layer pattern
- Toast notifications > alerts

### Real-time Features
- WebSocket connection management
- Message broadcasting
- Online status tracking

---

**Last Updated**: January 5, 2026
**Version**: 2.0
**Status**: Production Ready ✅
