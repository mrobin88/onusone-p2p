
import { useRouter } from 'next/router';
import useSWR from 'swr';
import { useSession } from 'next-auth/react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const UserProfilePage = () => {
  const router = useRouter();
  const { username } = router.query;
  const { data: session } = useSession();

  const { data: userData, error } = useSWR(username ? `/api/users/${username}/connections` : null, fetcher);
  const { data: myConnections, mutate } = useSWR(
    session?.user?.name ? `/api/users/${session.user.name}/connections` : null,
    fetcher
  );

  const handleFollow = async () => {
    await fetch(`/api/users/${username}/follow`, { method: 'POST' });
    mutate(); 
  };

  const handleUnfollow = async () => {
    await fetch(`/api/users/${username}/follow`, { method: 'DELETE' });
    mutate();
  };

  if (error) return <div>Failed to load user</div>;
  if (!userData) return <div>Loading...</div>;

  const isFollowing = myConnections?.following?.includes(username);
  const isSelf = session?.user?.name === username;

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center p-4">
      <div className="w-full max-w-2xl bg-gray-800 rounded-lg shadow-md p-8 mt-8">
        <h1 className="text-3xl font-bold mb-2 text-center">{username}</h1>
        
        {!isSelf && session && (
          <div className="text-center mb-4">
            {isFollowing ? (
              <button onClick={handleUnfollow} className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">
                Unfollow
              </button>
            ) : (
              <button onClick={handleFollow} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                Follow
              </button>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 my-6 text-center">
          <div>
            <p className="text-2xl font-bold">{userData?.followers?.length || 0}</p>
            <p className="text-gray-400">Followers</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{userData?.following?.length || 0}</p>
            <p className="text-gray-400">Following</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;

