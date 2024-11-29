import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { EncryptionModule } from './encryption/encryption.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017/csfle-demo', {
      autoCreate: true,
      autoIndex: true,
      directConnection: true, // Required for CSFLE
      monitorCommands: true, // Helpful for debugging
    }),
    EncryptionModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
