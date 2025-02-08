export default function Header({ user }) {
  return (
    <header className="bg-gray-900 p-4 flex justify-between items-center">
      <h1 className="text-2xl font-bold">United Islands Darknet</h1>
      {user && (
        <div className="text-right">
          <p>{user.name}</p>
          <p className="text-sm text-gray-400">{user.anonymousId}</p>
        </div>
      )}
    </header>
  )
}

