var db=require('../config/connection')
var collection=require('../config/collections')
const { response } = require('express')
var objectId=require('mongodb').ObjectID
module.exports={
    addProducts:(products,callback)=>{
        
        db.get().collection(collection.PRODUCT_COLLECTION).insertOne(products).then((data)=>{
            
            callback(data.ops[0]._id)
        })
    },
    getAllProducts:()=>{
        return new Promise(async(resolve,reject)=>{
            let products=await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(products)
        })
    },
    deleteProduct:(proId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).removeOne({_id:objectId(proId)}).then((response)=>{
                resolve(response)
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
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectId(proId)},
            {
                $set:{
                    name:proDetails.name,
                    category:proDetails.category,
                    description:proDetails.description,
                    price:proDetails.price,


                }
            }).then((response)=>{
                resolve()
            })
        })
    }
   
}