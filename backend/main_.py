from fastapi import FastAPI

app = FastAPI()

from app.api.v1.auth import router as auth_router
from app.api.v1.shops import router as shops_router
from app.api.v1 import products
from app.api.v1.orders import router as orders_router
from app.api.v1.upload import router as upload_router 

app.include_router(auth_router, prefix="/api/v1")
app.include_router(shops_router, prefix="/api/v1")
app.include_router(products.router, prefix="/api/v1")
app.include_router(orders_router, prefix="/api/v1")
app.include_router(upload_router, prefix="/api/v1")

@app.get("/")
def root():
    return {"status": "OK?"}
