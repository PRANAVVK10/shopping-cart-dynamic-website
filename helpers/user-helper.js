var db=require('../config/connection')
var collection=require('../config/collections')
const bcrypt=require('bcrypt')
const { use } = require('../routes/user')
const { response } = require('express')
var objectId=require('mongodb').ObjectID
const Razorpay=require('razorpay')
const { promises } = require('fs')
const { resolve } = require('path')
var instance = new Razorpay({
    key_id: 'rzp_test_7LcHNMwFG4GeNR',
    key_secret: 'HQGfUiJFa3KMaMqOOVNii2Re',
  });
module.exports={
  
    doSignup:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            userData.password=await bcrypt.hash(userData.password,10)
            db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data)=>{
                resolve(data.ops[0])
            })
        })
        

    },
    doLogin:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            let response={}
            let user=await db.get().collection(collection.USER_COLLECTION).findOne({email:userData.email})
            if(user){
                bcrypt.compare(userData.password,user.password).then((status)=>{
                    if(status){
                     
                        response.user=user
                        response.status=true
                        resolve(response)
                    }else{
                   
                        resolve({status:false}) 
                    }
                })
            }else{
              
                resolve({status:false})
            }

        })
    },
    addToCart:(proId,userId)=>{
        let proObj={
            item:objectId(proId),
            quantity:1
        }
        return new Promise(async(resolve,reject)=>{
            let userCart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
            if(userCart){
                let proExist=userCart.product.findIndex(product=> product.item==proId)
                console.log("pranav"+proExist)
                if(proExist!=-1){
                    db.get().collection(collection.CART_COLLECTION).updateOne({user:objectId(userId),'product.item':objectId(proId)},
                    {
                        $inc:{'product.$.quantity':1}
                    }
                    ).then(()=>{
                        resolve()
                    })
                }else{

                db.get().collection(collection.CART_COLLECTION).updateOne({user:objectId(userId)},
                {
                    
                        $push:{product:proObj}
                   
                }
                ).then((response)=>{
                    resolve()
                })
                }
            }else{
                let cartObj={
                    user:objectId(userId),
                    product:[proObj]
                   
                }
                
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response)=>{
                    resolve()
                })
            }
        })
    },
    getCartProducts:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            cartItems=await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match:{user:objectId(userId)}
                },
                {
                    $unwind:'$product'
                },
                {
                    $project:{
                        item:'$product.item',
                        quantity:'$product.quantity'
                    }
                },
                
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                    }
                }
                
            ]).toArray()
           
            resolve(cartItems)
        })
    },
    getCartCount:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let count=0
            let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
            if(cart){
                count=cart.product.length
            }
            
            resolve(count)
        })
    },
    changeProductQuantity:(details)=>{
        details.count=parseInt(details.count)
        details.quantity=parseInt(details.quantity)
        return new Promise((resolve,reject)=>{
            if(details.count==-1 && details.quantity==1){
                db.get().collection(collection.CART_COLLECTION).updateOne({_id:objectId(details.cart)},
                {
                    $pull:{product:{item:objectId(details.product)}}
                }
                ).then((response)=>{
                    resolve({removeProduct:true})
                })
            }else{
                db.get().collection(collection.CART_COLLECTION).updateOne({_id:objectId(details.cart),'product.item':objectId(details.product)},
                {
                    $inc:{'product.$.quantity':details.count}
                }
                ).then((response)=>{
                    resolve({status:true})
                })
    
             }
        })
    },
    getTotalAmount:(userId)=>{
       
        return new Promise(async(resolve,reject)=>{
            total=await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match:{user:objectId(userId)}
                },
                {
                    $unwind:'$product'
                },
               
                {
                    $project:{
                        item:'$product.item',
                        quantity:'$product.quantity'
                    }
                },
               
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'products'
                    }
                },
                {
                    $project:{
                        item:1,quantity:1,product:{$arrayElemAt:['$products',0]}
                    }
                },
                {
                    $group:{
                        _id:null,
                       total:{$sum:{$multiply:['$quantity','$products.price']}}
                    }
                }
                
            ]).toArray()
            console.log(total);
          
            resolve(total[0].total)
        })
    },
    placeOrder:(order,products,total)=>{
        return new Promise((resolve,reject)=>{
           let status=order['payment-method']==='COD'?'placed':'pending'
           let orderObj={
               deliveryDetails:{
                   mobile:order.mobile,
                   address:order.address,
                   pincode:order.pincode
               },
               userId:objectId(order.userId),
               paymentMethod:order['payment-method'],
               products:products,
               totalAmount:total,
               status:status,
               date:new Date()
           }
           db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response)=>{
               db.get().collection(collection.CART_COLLECTION).removeOne({user:objectId(order.userId)})
                resolve(response.ops[0]._id)
           })
        })
    },
    getCartProductList:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
            resolve(cart.product)
        })
    },
    getUserOrders:(userId)=>{
        
        return new Promise(async(resolve,reject)=>{
            let orders=await db.get().collection(collection.ORDER_COLLECTION).
            find({userId:objectId(userId)}).toArray()
           
            resolve(orders)
        })
    },
    getOrderProducts:(orderId)=>{
        return new Promise(async(resolve,reject)=>{
          let orderItems=await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match:{_id:objectId(orderId)}
                },
                {
                    $unwind:'$product'
                },
                {
                    $project:{
                        item:'$product.item',
                        quantity:'$product.quantity'
                    }
                },
                
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                    }
                }
                
            ]).toArray()
           console.log("****"+orderItems);
            resolve(orderItems)
        })
    },
    generateRazorpay:(orderId,total)=>{
        return new Promise((resolve,reject)=>{
            var options = {
                amount: "50000",  // amount in the smallest currency unit
                currency: "INR",
                receipt: ""+orderId
              };
              instance.orders.create(options, function(err, order) {
                  if(err){
                    console.log(err)
                  }else{
                console.log("**new order",order);
                resolve(order)
                  }
              });
        })
    },
    verifyPayment:(details)=>{
        return new Promise((resolve,reject)=>{
            const crypto = require('crypto');
            let hmac = crypto.createHmac('sha256', 'HQGfUiJFa3KMaMqOOVNii2Re');
            hmac.update(details['payment[razorpay_order_id]'+'|'+details['payment[razorpay_payment_id]']]);
            hmac=hmac.digest('hex')
            if(hmac==details['payment[razorpay_signature]']){
                resolve()
            }else{
                reject()
            }
        })
    },
    changePaymentStatus:(orderId)=>{
        return new promise((resolve,reject)=>{
            db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:objectId(orderId)},
            {
                $set:{
                    status:'placed'
                }
            }
            ).then(()=>{
                resolve()
            })
        })
    }
            
}     