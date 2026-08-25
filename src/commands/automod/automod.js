import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { getEffectiveConfig, saveConfig } from '../../systems/automod.js';
import { successEmbed, brandedEmbed, errorEmbed } from '../../utils/embeds.js';
import { config } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('automod')
    .setDescription('Configure automatic moderation.')
    .addSubcommand((s) => s.setName('enable').setDescription('Enable auto moderation.'))
    .addSubcommand((s) => s.setName('disable').setDescription('Disable auto moderation.'))
    .addSubcommand((s) =>
      s
        .setName('settings')
        .setDescription('View or tweak automod settings.')
        .addStringOption((o) =>
          o.setName('module').setDescription('Module to toggle').setRequired(false).addChoices(
            { name: 'Spam', value: 'spam' },
            { name: 'Mentions', value: 'mentions' },
            { name: 'Caps', value: 'caps' },
            { name: 'Duplicate', value: 'duplicate' },
            { name: 'Links', value: 'links' },
            { name: 'Invites', value: 'invites' },
            { name: 'Keywords', value: 'keywords' },
            { name: 'Flood', value: 'flood' },
            { name: 'Raid', value: 'raid' },
            { name: 'Account Age', value: 'accountAge' },
          ),
        )
        .addBooleanOption((o) => o.setName('enabled').setDescription('Enable or disable the module').setRequired(false))),
  requiredLevel: config.permissionLevels.ADMINISTRATOR,
  requiredPermissions: [PermissionFlagsBits.ManageGuild],
  cooldown: 2000,
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const cfg = getEffectiveConfig(interaction.guild.id);

    if (sub === 'enable') {
      cfg.enabled = true;
      saveConfig(interaction.guild.id, cfg);
      return interaction.reply({ embeds: [successEmbed('Auto moderation **enabled**. All configured modules are now active.')] });
    }
    if (sub === 'disable') {
      cfg.enabled = false;
      saveConfig(interaction.guild.id, cfg);
      return interaction.reply({ embeds: [successEmbed('Auto moderation **disabled**.')] });
    }

    // settings
    const moduleKey = interaction.options.getString('module');
    const enabled = interaction.options.getBoolean('enabled');
    if (moduleKey && enabled !== null) {
      if (cfg[moduleKey] && typeof cfg[moduleKey] === 'object') {
        cfg[moduleKey].enabled = enabled;
        saveConfig(interaction.guild.id, cfg);
        return interaction.reply({ embeds: [successEmbed(`Module **${moduleKey}** is now **${enabled ? 'enabled' : 'disabled'}**.`)] });
      }
      return interaction.reply({ embeds: [errorEmbed('That module cannot be toggled directly.')] });
    }

    // view settings
    const fields = [
      { name: 'Master', value: cfg.enabled ? '✅ Enabled' : '❌ Disabled', inline: true },
      { name: 'Spam', value: `${cfg.spam.enabled ? '✅' : '❌'} (max ${cfg.spam.max}/${cfg.spam.window}ms)`, inline: true },
      { name: 'Mentions', value: `${cfg.mentions.enabled ? '✅' : '❌'} (max ${cfg.mentions.max})`, inline: true },
      { name: 'Caps', value: `${cfg.caps.enabled ? '✅' : '❌'} (≥${cfg.caps.threshold * 100}%, min ${cfg.caps.minLength})`, inline: true },
      { name: 'Duplicate', value: `${cfg.duplicate.enabled ? '✅' : '❌'} (max ${cfg.duplicate.max})`, inline: true },
      { name: 'Links', value: cfg.links.enabled ? '✅' : '❌', inline: true },
      { name: 'Invites', value: cfg.invites.enabled ? '✅' : '❌', inline: true },
      { name: 'Keywords', value: `${cfg.keywords.enabled ? '✅' : '❌'} (${cfg.keywords.list?.length || 0} entries)`, inline: true },
      { name: 'Flood', value: `${cfg.flood.enabled ? '✅' : '❌'} (max ${cfg.flood.max}/${cfg.flood.window}ms)`, inline: true },
      { name: 'Raid', value: `${cfg.raid.enabled ? '✅' : '❌'} (${cfg.raid.joins}/${cfg.raid.window}ms)`, inline: true },
      { name: 'Account Age', value: `${cfg.accountAge.enabled ? '✅' : '❌'} (min ${cfg.accountAge.minDays}d)`, inline: true },
    ];
    return interaction.reply({ embeds: [brandedEmbed('**ORGVNUM — Auto Moderation Settings**\n\nUse `/automod settings <module> <enabled>` to toggle a module.', 'ORGVNUM — Automod').addFields(fields)], ephemeral: true });
  },
};
