import React from 'react'

interface ButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'accent'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  href?: string
  external?: boolean
}

export default function Button({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'md', 
  className = '',
  href,
  external = false
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center font-semibold rounded-lg transition-colors duration-200'
  
  const variants = {
    primary: 'bg-primary text-white hover:bg-blue-700',
    secondary: 'border-2 border-primary text-primary dark:text-white dark:border-white hover:bg-primary hover:text-white dark:hover:bg-white dark:hover:text-black',
    accent: 'bg-accent-yellow text-black hover:bg-yellow-400'
  }
  
  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  }
  
  const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`
  
  if (href) {
    if (external) {
      return (
        <a 
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={classes}
        >
          {children}
        </a>
      )
    }
    
    return (
      <a href={href} className={classes}>
        {children}
      </a>
    )
  }
  
  return (
    <button onClick={onClick} className={classes}>
      {children}
    </button>
  )
}
