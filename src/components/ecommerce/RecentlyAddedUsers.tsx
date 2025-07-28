import React from 'react';

const RecentlyAddedUsers = () => {
    const users = [
        {
            id: 1,
            name: "Alex Saprun",
            email: "alexsaprun123@gmail.com",
            avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face"
        },
        {
            id: 2,
            name: "Ester Haword",
            email: "Esterhaword123@gmail.com",
            avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
        },
        {
            id: 3,
            name: "Elenor Pena",
            email: "elenorpena123@gmail.com",
            avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face"
        },
        {
            id: 4,
            name: "Sameer Saim",
            email: "sameersaim123@gmail.com",
            avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
        },
        {
            id: 5,
            name: "Ester Haword",
            email: "Esterhaword123@gmail.com",
            avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
        },
        {
            id: 6,
            name: "Alex Saprun",
            email: "alexsaprun123@gmail.com",
            avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face"
        },
        {
            id: 6,
            name: "Alex Saprun",
            email: "alexsaprun123@gmail.com",
            avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face"
        },
        {
            id: 6,
            name: "Alex Saprun",
            email: "alexsaprun123@gmail.com",
            avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face"
        },
    ];

    return (
        <div className="bg-white rounded-2xl shadow-md p-6 w-full flex-col h-[460px] ">
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Users Logged In By</h4>


            {/* Scrollable user list */}
            <div className="flex-1 overflow-y-auto h-[400px] space-y-2 custom-scrollbar">
                {users.map((user) => (
                    <div
                        key={`${user.id}-${user.email}`}
                        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                        <div className="flex-shrink-0">
                            <img
                                src={user.avatar}
                                alt={`${user.name}'s avatar`}
                                className="w-12 h-12 rounded-full object-cover border-2 border-gray-100"
                            />
                        </div>

                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                                {user.name}
                            </p>
                            <p className="text-sm text-gray-500 truncate">
                                {user.email}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>

    );
};

export default RecentlyAddedUsers;