
import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { UsersService } from './src/modules/users/users.service';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const usersService = app.get(UsersService);
    const users = await usersService.findAll();
    console.log('--- USERS AND ROLES ---');
    users.forEach(u => {
        console.log(`ID: ${u.id}, Username: ${u.username}, Role: '${u.role}', Tasks: ${u.tasks}`);
    });
    console.log('-----------------------');
    await app.close();
}
bootstrap();
