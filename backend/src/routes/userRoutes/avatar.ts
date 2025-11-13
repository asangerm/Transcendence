import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { requireAuth, AuthUser } from "../../middleware/authMiddleware";
import fs from "fs";
import path from "path";
import { pipeline } from "stream";
import util from "util";
import { MultipartFile, Multipart } from "@fastify/multipart";

const pump = util.promisify(pipeline);

type AuthRequest = FastifyRequest & { user?: AuthUser };

// Typage multipart compatible Fastify v4
interface MultipartRequest extends FastifyRequest {
  parts: () => AsyncIterableIterator<Multipart>;
}

export default async function modifyAvatar(app: FastifyInstance) {
  // -------------------
  // UPLOAD AVATAR
  // -------------------
  app.post(
    "/avatar",
    { preHandler: [requireAuth] },
    async (req: MultipartRequest & AuthRequest, reply: FastifyReply) => {
      try {
        if (!req.user) {
          return reply.status(401).send({ error: true, message: "Unauthorized" });
        }

        const parts = req.parts();
        let filePart: MultipartFile | null = null;

        for await (const part of parts) {
          if ("file" in part) {
            if (!(part.mimetype || "").startsWith("image/")) {
              return reply.status(400).send({ error: true, message: "Invalid file type. Only images allowed." });
            }
            filePart = part as MultipartFile;
            break;
          }
        }

        if (!filePart) {
          return reply.status(400).send({ error: true, message: "No file uploaded" });
        }

        const uploadDir = path.join(process.cwd(), "uploads", "avatars");
        fs.mkdirSync(uploadDir, { recursive: true });

        const ext = path.extname(filePart.filename);
        const safeFilename = `${req.user.id}-${Date.now()}${ext}`.replace(/[^a-zA-Z0-9.-]/g, "_");
        const filePath = path.join(uploadDir, safeFilename);

        await pump(filePart.file, fs.createWriteStream(filePath));

        const relativePath = `/uploads/avatars/${safeFilename}`;

        const user = app.db
          .prepare("SELECT avatar_url FROM users WHERE id = ?")
          .get(req.user.id) as { avatar_url?: string } | undefined;

        if (user?.avatar_url && !user.avatar_url.includes("default.png")) {
        const oldPath = path.join(process.cwd(), user.avatar_url.replace(/^\/+/g, ""));
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }

        app.db.prepare("UPDATE users SET avatar_url = ? WHERE id = ?").run(relativePath, req.user.id);

        return reply.send({ avatarUrl: relativePath });
      } catch (error: any) {
        console.error("Erreur upload avatar:", error);
        return reply.status(500).send({ error: true, message: "Internal Server Error" });
      }
    }
  );

  // -------------------
  // DELETE AVATAR
  // -------------------
  app.delete("/avatar", { preHandler: [requireAuth] }, async (req: AuthRequest, reply: FastifyReply) => {
    try {
      if (!req.user) {
        return reply.status(401).send({ error: true, message: "Unauthorized" });
      }

      const defaultAvatar = "/uploads/default.png";

      const user = app.db
        .prepare("SELECT avatar_url FROM users WHERE id = ?")
        .get(req.user.id) as { avatar_url?: string } | undefined;

      if (user?.avatar_url && !user.avatar_url.includes("default.png")) {
        const oldPath = path.join(process.cwd(), user.avatar_url.replace(/^\/+/g, ""));
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }

      app.db.prepare("UPDATE users SET avatar_url = ? WHERE id = ?").run(defaultAvatar, req.user.id);

      return reply.send({ avatarUrl: defaultAvatar });
    } catch (error: any) {
      console.error("Erreur suppression avatar:", error);
      return reply.status(500).send({ error: true, message: "Internal Server Error" });
    }
  });
}
