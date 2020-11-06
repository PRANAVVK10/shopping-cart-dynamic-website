var db=require("../config/connection")
var collection=require("../config/collections")
const { response } = require("express")
var objectId=require('mongodb').ObjectID
module.exports={
    addProduct:(product,callback)=>{
       
        db.get().collection("product").insertOne(product).then((data)=>{
            console.log(data);
            callback(data.ops[0]._id)
        })
    },
    getAllProducts:()=>{
        return new Promise(async(resolve,reject)=>{
            let product= await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(product)
        })
    },
    deleteProduct:(prodId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).removeOne({_id:objectId(prodId)}).then((response)=>{
                resolve()
            })
        })
    },
    getProductDetails:(proId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(proId)}).then((product)=>{
                resolve(product)
            })
        })
    },
    updateProduct:(proId,proDetails)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectId(proId)},{
                $set:{
                    name:proDetails.name,
                    description:proDetails.description,
                    price:proDetails.price,
                    category:proDetails.category
                }
            }).then((response)=>{
                resolve()
            })
        })
    }
}