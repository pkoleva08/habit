import { useState } from 'react'

export default function PasswordInput({
	value,
	onChange,
	placeholder = 'Password',
	autoComplete = 'current-password',
	required = false,
}) {
	const [showPassword, setShowPassword] = useState(false)

	return (
		<div className="password-field">
			<input
				autoComplete={autoComplete}
				type={showPassword ? 'text' : 'password'}
				placeholder={placeholder}
				value={value}
				onChange={onChange}
				required={required}
			/>
			<button
				type="button"
				className={`password-toggle ${showPassword ? 'visible' : 'hidden'}`}
				aria-label={showPassword ? 'Hide password' : 'Show password'}
				onClick={() => setShowPassword((prev) => !prev)}
			>
				<span className="eye-icon" aria-hidden="true">
					<span className="eye-ball" />
				</span>
			</button>
		</div>
	)
}
