import React, { useEffect } from 'react';

const Customers = () => {
    // other state declarations

    // Removed detailLoading state

    useEffect(() => {
        // some logic
        // Removed setDetailLoading(true);
    }, []);

    const handleSomeAction = () => {
        // some other logic
    };

    return (
        <div>
            {/* component JSX */}
        </div>
    );
};

export default Customers;