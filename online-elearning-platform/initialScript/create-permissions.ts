import { NestFactory } from '@nestjs/core'
import { AppModule } from 'src/app.module'
import { HTTPMethod, RoleName } from 'src/shared/constants/role.constants'
import { PrismaService } from 'src/shared/services/prisma.service'

const prisma = new PrismaService()

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  await app.listen(3003)
  const server = app.getHttpAdapter().getInstance()
  const router = server.router
  const permissionInDb = await prisma.permission.findMany({
    where: {
      deletedAt: null,
    },
  })

  const availableRoutes: { path: string; method: keyof typeof HTTPMethod; name: string }[] = router.stack
    .map((layer) => {
      if (layer.route) {
        const path = layer.route?.path
        const method = String(layer.route?.stack[0].method).toUpperCase() as keyof typeof HTTPMethod
        return {
          path,
          method,
          name: method + ' ' + path,
        }
      }
    })
    .filter((item) => item !== undefined)
  // Tao object permissionInDbMap với key là [method-path]
  const permissionInDbMap: Record<string, typeof permissionInDb> = permissionInDb.reduce((acc, item) => {
    acc[`${item.method}-${item.path}`] = item
    return acc
  }, {})

  // Tao object availableRoutesMap với key là [method-path]
  const availableRoutesMap: Record<string, (typeof availableRoutes)[0]> = availableRoutes.reduce((acc, item) => {
    acc[`${item.method}-${item.path}`] = item
    return acc
  }, {})

  // Tìm permissions trong db mà kh tồn tại trong availableRoutes
  const permissionsToDelete = permissionInDb.filter((item) => {
    return !availableRoutesMap[`${item.method}-${item.path}`]
  })

  // Xoa permissions kh ton tai trong availableRoutes
  if (permissionsToDelete.length > 0) {
    const deleteResult = await prisma.permission.deleteMany({
      where: {
        id: {
          in: permissionsToDelete.map((item) => item.id),
        },
      },
    })

    console.log('delete permissions:', deleteResult.count)
  } else {
    console.log('No permission to delete')
  }

  // tim routes ma kh ton tai trong permissionsInDb
  const routesToAdd = availableRoutes.filter((item) => {
    return !permissionInDbMap[`${item.method}-${item.path}`]
  })

  if (routesToAdd.length > 0) {
    let createdCount = 0

    for (const route of availableRoutes) {
      if (!route || !route.path || !route.method) continue
      // Add to database
      const permission = await prisma.permission.upsert({
        where: {
          path_method: {
            path: route.path,
            method: route.method,
          },
        },
        update: {
          name: route.name,
        },
        create: {
          path: route.path,
          method: route.method,
          name: route.name,
          deletedAt: null,
        },
      })

      if (Math.abs(permission.createdAt.getTime() - permission.updatedAt.getTime()) < 1000) {
        createdCount++
      }
    }

    console.log(createdCount)
  } else {
    console.log('No permissions to add')
  }

  // lay lai permissions trong db sau khi them moi (hoac xoa)
  const updatedPermissionsInDb = await prisma.permission.findMany({
    where: {
      deletedAt: null,
    },
  })

  // cap nhat lai cac permission trong admin role hoac teacher role
  await prisma.role.update({
    where: {
      name: RoleName.Admin,
      deletedAt: null,
    },
    data: {
      permissions: {
        set: updatedPermissionsInDb.map((item) => ({ id: item.id })),
      },
    },
  })
  process.exit(0)
}
bootstrap()
