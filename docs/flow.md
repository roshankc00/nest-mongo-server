# MongoDB Client-Side Field Level Encryption (CSFLE) Guide

## What is CSFLE?
Client-Side Field Level Encryption (CSFLE) is like having a personal safe for your sensitive data. Before your data even reaches MongoDB, it's encrypted on your application side, ensuring that even if someone gets access to your database, they can't read the sensitive information.

## How Our Implementation Works

### 1. Setting Up the Safe (Initialization)
When the application starts:
- We create a special vault (called a Key Vault) in MongoDB
- We generate a master key (like a master password)
- We either create a new data key or use an existing one
- This is all handled automatically by our `EncryptionService`

### 2. Protecting Sensitive Data (Encryption)
When you create a new user with sensitive data:
```json
{
    "name": "John Doe",
    "ssn": "123-45-6789",           // Will be encrypted
    "creditCardNumber": "4111...",   // Will be encrypted
    "email": "john@example.com"
}
```

The process works like this:
1. You send the data to the API
2. Before saving to MongoDB:
   - SSN is encrypted with "deterministic" encryption (so you can search by it)
   - Credit card is encrypted with "random" encryption (maximum security)
3. The encrypted data is stored in MongoDB

### 3. Types of Encryption
We use two types of encryption:

#### Deterministic Encryption (for SSN)
- Like using the same lock every time
- If you encrypt "123-45-6789" twice, you get the same result
- Allows you to search for users by SSN
- Used when you need to find data later

#### Random Encryption (for Credit Cards)
- Like using a different lock each time
- If you encrypt the same number twice, you get different results
- More secure but you can't search by this field
- Used for data that you only need to retrieve, not search

### 4. Retrieving Data (Decryption)
When you fetch a user:
1. The encrypted data is retrieved from MongoDB
2. Our system automatically decrypts the sensitive fields
3. You receive the data in its original form

Example response:
```json
{
    "name": "John Doe",
    "ssn": "123-45-6789",           // Automatically decrypted
    "creditCardNumber": "4111...",   // Automatically decrypted
    "email": "john@example.com"
}
```

## Available API Endpoints

### Create a New User
```http
POST /users
Content-Type: application/json

{
    "name": "John Doe",
    "ssn": "123-45-6789",
    "creditCardNumber": "4111-1111-1111-1111",
    "email": "john@example.com"
}
```

### Find User by ID
```http
GET /users/:id
```

### Find User by SSN
```http
GET /users/ssn/:ssn
```

## Security Benefits
1. **Data is Always Protected**: Sensitive data is encrypted before it leaves your application
2. **Different Security Levels**: Different encryption types for different security needs
3. **Secure Key Management**: Encryption keys are stored separately from the data
4. **Transparent Usage**: The encryption/decryption process is automatic and seamless

## Best Practices
1. Always use random encryption for highly sensitive data that doesn't need to be searched
2. Use deterministic encryption only when you need to search by that field
3. Never store encryption keys in the same database as your encrypted data
4. Keep your master key secure and separate from your application

## Error Handling
The system will automatically handle common issues:
- If encryption fails, you'll get a clear error message
- If the encryption service isn't initialized, operations will fail safely
- All encryption operations are logged for debugging

## Technical Requirements
- MongoDB 4.2 or later
- Node.js 18 or later
- Required packages:
  - mongodb-client-encryption
  - @nestjs/mongoose
  - mongoose
