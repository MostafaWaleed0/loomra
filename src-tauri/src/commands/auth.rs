use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};

/// Custom error type for authentication operations
#[derive(Debug, thiserror::Error)]
pub enum AuthError {
    #[error("Password hashing failed: {0}")]
    HashingError(String),

    #[error("Password verification failed: {0}")]
    VerificationError(String),

    #[error("Invalid password hash format")]
    InvalidHashFormat,
}

impl From<AuthError> for String {
    fn from(err: AuthError) -> Self {
        err.to_string()
    }
}

/// Hash a password using Argon2id
#[tauri::command]
pub async fn hash_password(password: String) -> Result<String, String> {
    // Validate password length
    if password.is_empty() {
        return Err("Password cannot be empty".to_string());
    }

    if password.len() < 8 {
        return Err("Password must be at least 8 characters long".to_string());
    }

    // Generate salt and hash password
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();

    let hash = argon2
        .hash_password(password.as_bytes(), &salt)
        .map_err(|e| format!("Failed to hash password: {}", e))?;

    Ok(hash.to_string())
}

/// Verify a password against a hash
#[tauri::command]
pub async fn verify_password(
    password: String,
    hashed_password: String,
) -> Result<bool, String> {
    // Validate inputs
    if password.is_empty() {
        return Err("Password cannot be empty".to_string());
    }

    if hashed_password.is_empty() {
        return Err("Hashed password cannot be empty".to_string());
    }

    // Parse the hash
    let parsed_hash = PasswordHash::new(&hashed_password)
        .map_err(|e| format!("Invalid password hash format: {}", e))?;

    // Verify the password
    let is_valid = Argon2::default()
        .verify_password(password.as_bytes(), &parsed_hash)
        .is_ok();

    Ok(is_valid)
}

/// Check password strength and return feedback
#[tauri::command]
pub async fn check_password_strength(password: String) -> Result<PasswordStrength, String> {
    let length = password.len();
    let has_uppercase = password.chars().any(|c| c.is_uppercase());
    let has_lowercase = password.chars().any(|c| c.is_lowercase());
    let has_digit = password.chars().any(|c| c.is_numeric());
    let has_special = password.chars().any(|c| !c.is_alphanumeric());

    let mut score = 0;
    let mut feedback = Vec::new();

    // Length check
    if length >= 8 {
        score += 1;
    } else {
        feedback.push("Password should be at least 8 characters long".to_string());
    }

    if length >= 12 {
        score += 1;
    }

    // Character variety checks
    if has_uppercase {
        score += 1;
    } else {
        feedback.push("Include uppercase letters".to_string());
    }

    if has_lowercase {
        score += 1;
    } else {
        feedback.push("Include lowercase letters".to_string());
    }

    if has_digit {
        score += 1;
    } else {
        feedback.push("Include numbers".to_string());
    }

    if has_special {
        score += 1;
    } else {
        feedback.push("Include special characters".to_string());
    }

    let strength = match score {
        0..=2 => "weak",
        3..=4 => "moderate",
        5..=6 => "strong",
        _ => "very_strong",
    };

    Ok(PasswordStrength {
        strength: strength.to_string(),
        score,
        feedback,
    })
}

#[derive(Debug, serde::Serialize)]
pub struct PasswordStrength {
    pub strength: String,
    pub score: i32,
    pub feedback: Vec<String>,
}