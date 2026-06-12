from data.mongo import db

async def get_transactions(location, property_type, radius_m):
    cursor = db.transactions.find(
        {"property_type": property_type},
        {"price": 1, "_id": 0}
    ).limit(30)

    return await cursor.to_list(length=30)
