import React, { useState, useEffect } from "react";

export default function Menu() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch("https://ic1ln5cze5.execute-api.us-east-1.amazonaws.com/MenuStage/getMenu");

                if (!response.ok) {
                    throw new Error("Failed to fetch data");
                }
                const data = await response.json();
                const body = JSON.parse(data.body);
                setData(body.data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return <p className="text-center py-20">Loading...</p>;
    }

    if (error) {
        return <p className="text-center py-20 text-red-600">Error: {error}</p>;
    }

    return (
        <div>
            <div className="pt-[100px] text-center pb-[50px]">
                <img
                    src={"/menulabel.png"}
                    alt="label"
                    width={162}
                    height={22}
                    className="mx-auto"
                />
                <p className="text-4xl pt-[30px] font-bold">
                    Why not have a drink with us?
                </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4 lg:px-20 pb-20">
                {data.map((item, index) => (
                    <div key={index} className="bg-white rounded-lg shadow-lg p-6">
                        {item.imageUrl && (
                            <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-full h-48 object-cover rounded-lg mb-4"
                            />
                        )}
                        <h3 className="text-2xl font-bold mb-2">{item.name}</h3>
                        <p className="text-gray-600 mb-2">{item.description}</p>
                        <p className="text-xl font-bold text-teal-600">${item.price}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
