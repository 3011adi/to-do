import React from 'react'
import Link from 'next/link'

const Page = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="text-center max-w-md bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold mb-4">Welcome to Todo App</h1>
        <p className="mb-6 text-gray-600">Organize your tasks and boost your productivity with our simple and intuitive to-do application.</p>
        <Link href="/auth">
          <button className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-6 rounded-md transition-colors">
            Get Started
          </button>
        </Link>
      </div>
    </div>
  )
}

export default Page