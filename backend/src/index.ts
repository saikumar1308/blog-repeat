import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import { Hono } from 'hono'
import { sign, verify } from 'hono/jwt';

const app = new Hono<{
  Bindings:{
    DATABASE_URL: string,
    JWT_SECRET: string
  },
  Variables:{
    userId:string
  }
}>();

app.post('/api/v1/signup',async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl:c.env?.DATABASE_URL,
  }).$extends(withAccelerate());

  const body = await c.req.json();
  try {
    const user = await prisma.user.create({
      data:{
        username: body.username,
        password: body.password
      }
    })
    const jwt = await sign({id:user.id},c.env.JWT_SECRET);
    return c.json({jwt});
  } catch (error) {
    c.status(403)
    return c.json({error:"errot while signing up"});
  }
  
})

app.post('/api/v1/signin',async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl:c.env?.DATABASE_URL
  }).$extends(withAccelerate())

  const body = await c.req.json()
  const user = await prisma.user.findUnique({
    where:{
      username:body.username
    }
  })

  if (!user) {
    c.status(403);
    return c.json({error:"user not found"})
  }

  const jwt = await sign({id:user.id},c.env.JWT_SECRET);
  return c.json({jwt})
})

app.use('/api/v1/blog/*', async (c, next) => {
  const jwt = c.req.header('Authorization');
  if(!jwt){
    c.status(401);
    return c.json({error:'Unauthorised'})
  }
  const token = jwt.split('')[1];
  const payload = await verify(token,c.env.JWT_SECRET);
  if(!payload){
    c.status(401);
    return c.json({error:'Unauthorised'})
  }
  c.set('userId',payload.id);
  await next()
})

app.post('/api/v1/blog', (c) => {
  console.log(c.get('userId'))
  return c.text('signin route')
})

app.put('/api/v1/user/signin', (c) => {
  return c.text('hloo')
})

app.get('/api/v1/blog/:id', (c) => {
  return c.text('hloo')
})

app.get('/api/v1/blog/bulk', (c) => {
  return c.text('hloo')
})

export default app
