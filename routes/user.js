const { response } = require('express');
var express = require('express');
var router = express.Router();
var collection=require('../helpers/product-helper')
var userHelper=require('../helpers/user-helper')
let verifyLogin=(req,res,next)=>{
  if(req.session.loggedIn){
    next()
  }else{
    res.redirect('/login')
  }
}

/* GET home page. */
router.get('/',async function(req, res, next) {
  let user=req.session.user
  let cartCount=null
  if(req.session.user){
  cartCount=await userHelper.getCartCount(req.session.user._id)
  }
  collection.getAllProducts().then((products)=>{
   
    res.render('user/view-products',{products,admin:false,user,cartCount});
  })

 
});
router.get('/login',(req,res)=>{
  if(req.session.loggedIn){
    res.redirect('/')
  }else
  res.render('user/user-login',({"loginerror":req.session.loggederr}))
  req.session.loggederr=false
})
router.get('/signup',(req,res)=>{
  res.render('user/user-signup')
})
router.post('/signup',(req,res)=>{
  userHelper.doSignup(req.body).then((response)=>{
    req.session.loggedIn=true
    req.session.user=response
    res.redirect('/')
  })
})
router.post('/login',(req,res)=>{
  userHelper.doLogin(req.body).then((response)=>{
   
    if(response.status){
      req.session.loggedIn=true
      req.session.user=response.user
      res.redirect('/')
    }else{
      req.session.loggederr="Invalid Username or Password"
      res.redirect('/login')
    }
  })
  
})
router.get('/logout',(req,res)=>{
  req.session.destroy()
  res.redirect('/')
})
router.get('/cart',verifyLogin,async (req,res)=>{
  let products=await userHelper.getCartProducts(req.session.user._id)
  let totalValue=await userHelper.getTotalAmount(req.session.user._id)
  res.render('user/user-cart',{products,'user':req.session.user,totalValue})
})
router.get('/user-cart/:id',(req,res)=>{
  console.log("api call");
  userHelper.addToCart(req.params.id,req.session.user._id).then(()=>{
    res.json({status:true})
  })
})
router.post('/change-product-quantity',(req,res,next)=>{
  userHelper.changeProductQuantity(req.body).then(async(response)=>{
    response.total=await userHelper.getTotalAmount(req.body.user)

    res.json(response)

  })
})
router.get('/place-order',verifyLogin,async (req,res)=>{
  let total=await userHelper.getTotalAmount(req.session.user._id)

  res.render('user/place-order',{total,user:req.session.user})
})
router.post('/place-order',async(req,res)=>{
  let products=await userHelper.getCartProductList(req.body.userId)
  let totalPrice=await userHelper.getTotalAmount(req.body.userId)
  userHelper.placeOrder(req.body,products,totalPrice).then((response)=>{
    res.json({status:true})
  })
  console.log(req.body)
})

module.exports = router;
